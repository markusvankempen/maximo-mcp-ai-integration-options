# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2026-09-16
### Changed
- Refreshed the documentation date shown on the npm package page.
- Aligned the VS Code extensions onto the same version line as the MCP server, so `maximo-mcp-server`, IBM Maximo MCP for AI and Maximo API Explorer all report 1.2.1.

## [1.2.0] - 2026-09-16
### Added
- `create_record` — create Work Orders, Assets and Service Requests via REST POST.
- `update_record` — partially update any Maximo record by ID.
- `run_action` — trigger Maximo business actions such as status changes and approvals.
- `SmartValidator` pre-flight validation: OSLC syntax checks, fuzzy field matching, site and worktype validation, and status transition checks.

### Fixed
- `renderCarbonDetails` was truncated and left the file unparseable, which prevented the server from starting.
- The server reported a hardcoded version of 1.0.0 regardless of the released version.

## [1.0.2] - 2026-02-05
### Changed
- Documentation improvements and path standardization for easier installation.
- Updated documentation dates.

## [1.0.0] - 2026-02-03
### Added
- Initial release of Maximo MCP Server.
