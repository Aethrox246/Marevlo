# Algorithm Visualizer Framework

This directory contains the logic and React components responsible for visualizing algorithm executions step-by-step within the IDE's Approaches tab.

## How to Add a New Algorithm Visualization

If you want to add a visualizer for a new problem (e.g., "Binary Search" or "Two Sum"), follow these exact 3 steps that we established:

### Step 1: Detect the Algorithm Type (`ProblemPanel.jsx`)
First, the system needs to know *when* to trigger your visualizer based on the problem title.
1. Open `src/pages/IDE/ProblemPanel.jsx`.
2. Locate the `getAlgorithmType` function.
3. Add a check for your new problem:
```javascript
if (lower.includes('binary search')) return 'binary-search';
```

### Step 2: Parse the Trace Data (`generateSteps.js`)
The visualization engine works by parsing the text-based `"trace"` string from your JSON problem file and converting it into JSON step objects.
1. Open `generateSteps.js`.
2. Write a new parsing function: `generateBinarySearchSteps(inputString, traceText)`.
3. Use a Regular Expression to split the text by `Step X:`
```javascript
const stepRegex = /Step \d+:([^]*?)(?=Step \d+:|$)/g;
```
4. Loop through the matches to extract important data (e.g., pointers like `left=0`, `right=5`, the `mid` index, or string states).
5. Push objects containing this state to a `steps` array and return it.
6. **Hook it up**: Back in `ProblemPanel.jsx`, update `generateVisualizationSteps()` to call your new generator when `algType === 'binary-search'`.

### Step 3: Create the UI Component (`AlgorithmVisualizer.jsx`)
Finally, build the visual frame that React will render for each step.
1. Open `AlgorithmVisualizer.jsx`.
2. Create a new stateless React component for your view:
```javascript
const BinarySearchVisualization = ({ step, inputString }) => {
    const { left, right, mid, found } = step;
    
    return (
        <div className="binary-search-viz">
            {/* Render your array, highlight 'mid', color 'left'/'right' bounds */}
        </div>
    );
};
```
3. Add your component into the `visualization-area` block:
```javascript
{algorithmType === 'binary-search' && (
    <BinarySearchVisualization step={step} inputString={inputData.string} />
)}
```
4. Style it in `AlgorithmVisualizer.css` (use `.badge`, `.success`, `.error`, etc. for consistent aesthetics).

---

### Important Pattern Note: Scaling
Currently, the visualizer relies heavily on **Regex Text Parsing** of the English trace strings. 
If this becomes too slow as you scale to hundreds of problems, consider updating the JSON data directly to include a `"traceData": [{ state: { ... } }]` array instead of purely text strings! This will eliminate the need to write custom regex parsers for future algorithms.
