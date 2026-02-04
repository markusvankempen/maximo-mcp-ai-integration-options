
export const mockComponents = {
    "default": {
        "button": {
            "default": {
                "description": "Component extracted from Button.js",
                "category": "ui",
                "props": {
                    "onClick": {
                        "type": "func",
                        "description": "Extracted from source"
                    },
                    "label": {
                        "type": "string",
                        "description": "Extracted from source"
                    }
                }
            }
        },
        "borderlayout": {
            "default": {
                "description": "Component extracted from BorderLayout.js",
                "category": "layout",
                "props": {
                    "height": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "width": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "top": {
                        "type": "element",
                        "description": "Extracted from source"
                    },
                    "bottom": {
                        "type": "element",
                        "description": "Extracted from source"
                    },
                    "start": {
                        "type": "element",
                        "description": "Extracted from source"
                    },
                    "end": {
                        "type": "element",
                        "description": "Extracted from source"
                    }
                }
            }
        },
        "col": {
            "default": {
                "description": "Component extracted from Col.js",
                "category": "layout",
                "props": {
                    "height": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "width": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "valignChildren": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    },
                    "halignChildren": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    },
                    "overflow": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    }
                }
            }
        },
        "row": {
            "default": {
                "description": "Component extracted from Row.js",
                "category": "layout",
                "props": {
                    "height": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "width": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "valignChildren": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    },
                    "halignChildren": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    },
                    "overflow": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    }
                }
            }
        },
        "section": {
            "default": {
                "description": "Component extracted from Section.js",
                "category": "layout",
                "props": {
                    "height": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "width": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "header": {
                        "type": "element",
                        "description": "Extracted from source"
                    },
                    "footer": {
                        "type": "element",
                        "description": "Extracted from source"
                    },
                    "layout": {
                        "type": "oneof",
                        "description": "Extracted from source"
                    }
                }
            }
        },
        "widget": {
            "default": {
                "description": "Component extracted from Widget.js",
                "category": "layout",
                "props": {
                    "size": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "height": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "width": {
                        "type": "oneoftype",
                        "description": "Extracted from source"
                    },
                    "color": {
                        "type": "string",
                        "description": "Extracted from source"
                    },
                    "border": {
                        "type": "string",
                        "description": "Extracted from source"
                    }
                }
            }
        },
        "table": {
            "default": {
                "description": "Data Table component (wraps Carbon DataTable)",
                "category": "data-display",
                "props": {
                    "datasource": { "type": "string", "description": "ID of the datasource", "required": true },
                    "title": { "type": "string", "description": "Table title" }
                },
                "children": ["table-column"]
            }
        }
    }
};

export const mockColors = {
    default: {
        "ui-01": "#ffffff",
        "ui-02": "#f4f4f4",
        "text-01": "#161616"
    }
};

export const mockIcons = {
    "add": { deprecated: false },
    "edit": { deprecated: false },
    "delete": { deprecated: false },
    "save": { deprecated: true }
};
