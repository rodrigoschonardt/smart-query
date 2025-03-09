# Smart Query Chrome Extension

A Chrome extension that allows you to search through web pages using URL patterns and advanced search queries.

## Features

- URL pattern matching with wildcard support
- Advanced search with logical operators (AND/OR)
- Concurrent page processing
- Configurable page load timeout
- Batch processing of search results
- One-click opening of all matching results

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### URL Pattern Matching
- Enter a URL pattern using wildcards (*)
- Example: `*.github.com/*` will match all GitHub pages
- Click "Find" to get matching links on the current page

### Search Operations
- Use AND/OR operators for complex searches
- Examples:
  - `react AND typescript`
  - `angular OR vue`
  - `javascript AND framework OR library`

### Configuration
- **Page Load Timeout**: Adjust waiting time for each page (milliseconds)
- **Concurrent Pages**: Set how many pages to process simultaneously (1-10)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
