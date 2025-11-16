# Dependencies Installation

## Seatmap Configuration Feature

To enable the seatmap visual editor, install the following packages:

```bash
cd frontend/web-app
npm install react-konva konva
```

### Package Details:
- **react-konva**: React bindings for Konva.js canvas library (~100KB)
- **konva**: Core canvas manipulation library (includes TypeScript definitions)

### Usage:
The seatmap editor uses react-konva to provide an interactive canvas for designing seat layouts.

### Verification:
After installation, check package.json includes:
```json
{
  "dependencies": {
    "react-konva": "^18.x.x",
    "konva": "^9.x.x"
  }
}
```
