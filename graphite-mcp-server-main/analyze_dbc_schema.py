#!/usr/bin/env python3
"""
Used to make sure that anything new added to the script.dtd also gets updated in the script_registry.json as well.
Enhanced DBC Schema Analysis Tool with Children Support
Compares script.dtd with script_registry.json and identifies:
1. Missing elements
2. Missing attributes on existing elements
3. Missing or incorrect children arrays

Usage:
    python analyze_dbc_schema_with_children.py --dry-run  # Show what would be changed
    python analyze_dbc_schema_with_children.py            # Apply changes
"""

import re
import json
import argparse
from typing import Dict, List, Set, Tuple, Optional
from collections import defaultdict

def parse_content_model(content_model: str) -> Optional[List[str]]:
    """
    Parse DTD content model to extract child element names.
    
    Examples:
        "(description?,check*,statements)" -> ["description", "check", "statements"]
        "(sql+)" -> ["sql"]
        "EMPTY" -> None (no children field should be added)
        "#PCDATA" or "(#PCDATA)" -> None (no children field should be added)
        "(a|b|c)*" -> ["a", "b", "c"]
    
    Returns:
        List of child element names, or None if element should not have children field
    """
    # Handle special cases - these should not have children field in JSON
    content_model = content_model.strip()
    if content_model == "EMPTY":
        return None
    
    # Check for #PCDATA (with or without parentheses)
    if "#PCDATA" in content_model:
        return None
    
    # Remove outer parentheses if present
    if content_model.startswith('(') and content_model.endswith(')'):
        content_model = content_model[1:-1]
    
    # Extract all element names (alphanumeric + underscore)
    # This regex finds element names, ignoring operators like ?, *, +, |, ,
    element_names = re.findall(r'([a-zA-Z_][a-zA-Z0-9_]*)', content_model)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_elements = []
    for name in element_names:
        if name not in seen:
            seen.add(name)
            unique_elements.append(name)
    
    return unique_elements if unique_elements else None

def parse_dtd_file(dtd_path: str) -> Dict:
    """
    Parse DTD file and extract elements with their attributes and children.
    
    Returns:
        {
            'element_name': {
                'attributes': {'attr_name': {'type': '...', 'required': bool, ...}},
                'children': ['child1', 'child2', ...]
            }
        }
    """
    elements = {}
    
    with open(dtd_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # First pass: Extract element declarations with content models
    element_pattern = r'<!ELEMENT\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+([^>]+)>'
    for match in re.finditer(element_pattern, content):
        element_name = match.group(1)
        content_model = match.group(2).strip()
        
        if element_name not in elements:
            elements[element_name] = {
                'attributes': {},
                'children': []
            }
        
        # Parse content model to extract children
        children = parse_content_model(content_model)
        # Only add children field if it's not None (i.e., not EMPTY or #PCDATA)
        if children is not None:
            elements[element_name]['children'] = children
    
    # Second pass: Extract attributes for each element
    attlist_pattern = r'<!ATTLIST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.*?)>'
    for match in re.finditer(attlist_pattern, content, re.DOTALL):
        element_name = match.group(1)
        attlist_content = match.group(2)
        
        if element_name not in elements:
            elements[element_name] = {
                'attributes': {},
                'children': []
            }
        
        # Parse individual attributes
        attr_pattern = r'([a-zA-Z_][a-zA-Z0-9_]*)\s+([^#\s][^\s]*(?:\s*\|[^\s]+)*)\s*(#REQUIRED|#IMPLIED|"[^"]*")?'
        for attr_match in re.finditer(attr_pattern, attlist_content):
            attr_name = attr_match.group(1)
            attr_type = attr_match.group(2).strip()
            attr_required = attr_match.group(3)
            
            is_required = attr_required == '#REQUIRED' if attr_required else False
            
            # Parse enumerated values if present
            enum_values = []
            if '|' in attr_type and attr_type.startswith('('):
                enum_match = re.match(r'\(([^)]+)\)', attr_type)
                if enum_match:
                    enum_values = [v.strip() for v in enum_match.group(1).split('|')]
            
            elements[element_name]['attributes'][attr_name] = {
                'type': attr_type,
                'required': is_required,
                'enum_values': enum_values
            }
    
    return elements

def parse_json_registry(json_path: str) -> Dict:
    """Parse the JSON registry file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_json_element_template(element_name: str, dtd_element: Dict) -> Dict:
    """Create a JSON element template from DTD element data."""
    template = {
        "name": element_name,
        "description": f"Element for {element_name}",
        "props": {}
    }
    
    # Add attributes
    for attr_name, attr_info in dtd_element['attributes'].items():
        attr_template = {
            "type": "string",
            "description": f"Attribute {attr_name}",
            "required": attr_info['required']
        }
        
        # Handle enumerated types
        if attr_info['enum_values']:
            attr_template["type"] = {
                "oneOf": [
                    {"value": val, "description": f"Value {val}"}
                    for val in attr_info['enum_values']
                ]
            }
        
        template["props"][attr_name] = attr_template
    
    # Add children array if element has children (and children key exists in dtd_element)
    if 'children' in dtd_element and dtd_element['children']:
        template["children"] = dtd_element['children']
    
    return template

def compare_schemas(dtd_elements: Dict, json_registry: Dict) -> Dict:
    """
    Compare DTD and JSON schemas to find differences.
    
    Returns:
        {
            'missing_elements': [element_names],
            'missing_attributes': {element_name: [attr_names]},
            'missing_children': {element_name: [child_names]},
            'incorrect_children': {element_name: {'current': [...], 'should_be': [...]}}
        }
    """
    differences = {
        'missing_elements': [],
        'missing_attributes': defaultdict(list),
        'missing_children': {},
        'incorrect_children': {}
    }
    
    # Find missing elements
    for element_name in dtd_elements:
        if element_name not in json_registry:
            differences['missing_elements'].append(element_name)
    
    # Find missing attributes and check children
    for element_name, dtd_element in dtd_elements.items():
        if element_name in json_registry:
            json_element = json_registry[element_name]
            
            # Check for missing attributes
            if 'props' in json_element:
                for attr_name in dtd_element['attributes']:
                    if attr_name not in json_element['props']:
                        differences['missing_attributes'][element_name].append(attr_name)
            
            # Check children array (only if DTD element has children key)
            if 'children' in dtd_element:
                dtd_children = set(dtd_element['children'])
                json_children = set(json_element.get('children', []))
                
                if dtd_children != json_children:
                    if not json_children and dtd_children:
                        # Missing children array entirely
                        differences['missing_children'][element_name] = list(dtd_children)
                    elif dtd_children:
                        # Children array exists but is incorrect
                        differences['incorrect_children'][element_name] = {
                            'current': list(json_children),
                            'should_be': list(dtd_children)
                        }
    
    return differences

def apply_changes(json_path: str, dtd_elements: Dict, differences: Dict, dry_run: bool = True):
    """Apply changes to the JSON registry file."""
    
    # Load current JSON
    json_registry = parse_json_registry(json_path)
    
    changes_made = 0
    
    # Add missing elements
    for element_name in differences['missing_elements']:
        if not dry_run:
            json_registry[element_name] = create_json_element_template(
                element_name, 
                dtd_elements[element_name]
            )
        changes_made += 1
        print(f"  {'[DRY-RUN] Would add' if dry_run else 'Added'} element: {element_name}")
        if 'children' in dtd_elements[element_name] and dtd_elements[element_name]['children']:
            print(f"    with children: {dtd_elements[element_name]['children']}")
    
    # Add missing attributes
    for element_name, attr_names in differences['missing_attributes'].items():
        for attr_name in attr_names:
            attr_info = dtd_elements[element_name]['attributes'][attr_name]
            attr_template = {
                "type": "string",
                "description": f"Attribute {attr_name}",
                "required": attr_info['required']
            }
            
            if attr_info['enum_values']:
                attr_template["type"] = {
                    "oneOf": [
                        {"value": val, "description": f"Value {val}"}
                        for val in attr_info['enum_values']
                    ]
                }
            
            if not dry_run:
                json_registry[element_name]['props'][attr_name] = attr_template
            changes_made += 1
            print(f"  {'[DRY-RUN] Would add' if dry_run else 'Added'} attribute: {element_name}.{attr_name}")
    
    # Add missing children arrays
    for element_name, children in differences['missing_children'].items():
        if not dry_run:
            json_registry[element_name]['children'] = children
        changes_made += 1
        print(f"  {'[DRY-RUN] Would add' if dry_run else 'Added'} children to: {element_name}")
        print(f"    children: {children}")
    
    # Fix incorrect children arrays
    for element_name, children_info in differences['incorrect_children'].items():
        if not dry_run:
            json_registry[element_name]['children'] = children_info['should_be']
        changes_made += 1
        print(f"  {'[DRY-RUN] Would update' if dry_run else 'Updated'} children for: {element_name}")
        print(f"    from: {children_info['current']}")
        print(f"    to:   {children_info['should_be']}")
    
    # Save changes
    if not dry_run and changes_made > 0:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_registry, f, indent=2)
        print(f"\n✓ Successfully updated {json_path}")
    
    return changes_made

def main():
    parser = argparse.ArgumentParser(
        description='Analyze and sync DBC schema files with children support'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making changes'
    )
    parser.add_argument(
        '--dtd',
        default='src/docs/dbc/script.dtd',
        help='Path to DTD file (default: src/docs/dbc/script.dtd)'
    )
    parser.add_argument(
        '--json',
        default='src/docs/dbc/script_registry.json',
        help='Path to JSON registry (default: src/docs/dbc/script_registry.json)'
    )
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("DBC Schema Analysis Tool with Children Support")
    print("=" * 80)
    print()
    
    # Parse files
    print(f"📖 Parsing DTD file: {args.dtd}")
    dtd_elements = parse_dtd_file(args.dtd)
    print(f"   Found {len(dtd_elements)} elements in DTD")
    
    print(f"📖 Parsing JSON registry: {args.json}")
    json_registry = parse_json_registry(args.json)
    print(f"   Found {len(json_registry)} elements in JSON")
    print()
    
    # Compare schemas
    print("🔍 Comparing schemas...")
    differences = compare_schemas(dtd_elements, json_registry)
    
    # Report findings
    total_issues = (
        len(differences['missing_elements']) +
        sum(len(attrs) for attrs in differences['missing_attributes'].values()) +
        len(differences['missing_children']) +
        len(differences['incorrect_children'])
    )
    
    print(f"\n📊 Analysis Results:")
    print(f"   Missing elements: {len(differences['missing_elements'])}")
    print(f"   Elements with missing attributes: {len(differences['missing_attributes'])}")
    print(f"   Elements with missing children: {len(differences['missing_children'])}")
    print(f"   Elements with incorrect children: {len(differences['incorrect_children'])}")
    print(f"   Total issues: {total_issues}")
    print()
    
    if total_issues == 0:
        print("✓ No differences found. Schemas are in sync!")
        return
    
    # Show details
    if differences['missing_elements']:
        print("\n❌ Missing Elements:")
        for elem in sorted(differences['missing_elements']):
            print(f"   - {elem}")
            if dtd_elements[elem]['children']:
                print(f"     children: {dtd_elements[elem]['children']}")
    
    if differences['missing_attributes']:
        print("\n❌ Missing Attributes:")
        for elem, attrs in sorted(differences['missing_attributes'].items()):
            print(f"   - {elem}:")
            for attr in sorted(attrs):
                print(f"     • {attr}")
    
    if differences['missing_children']:
        print("\n❌ Missing Children Arrays:")
        for elem, children in sorted(differences['missing_children'].items()):
            print(f"   - {elem}: {children}")
    
    if differences['incorrect_children']:
        print("\n⚠️  Incorrect Children Arrays:")
        for elem, info in sorted(differences['incorrect_children'].items()):
            print(f"   - {elem}:")
            print(f"     current:   {info['current']}")
            print(f"     should be: {info['should_be']}")
    
    # Apply changes
    print("\n" + "=" * 80)
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
    else:
        print("✏️  APPLYING CHANGES")
    print("=" * 80)
    print()
    
    changes_made = apply_changes(args.json, dtd_elements, differences, args.dry_run)
    
    print()
    print("=" * 80)
    if args.dry_run:
        print(f"✓ Dry run complete. Would make {changes_made} changes.")
        print("  Run without --dry-run to apply changes.")
    else:
        print(f"✓ Complete! Made {changes_made} changes.")
    print("=" * 80)

if __name__ == '__main__':
    main()

# Made with Bob
