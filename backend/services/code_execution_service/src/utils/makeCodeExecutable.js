const makePythonRunnerTemplate = (code, inputFilePath) => {
  return `import inspect
from typing import *

${code}

data = None
with open("${inputFilePath}", "r") as f:
    data = f.read()

solutionClass = Solution()
for method_name, method in inspect.getmembers(solutionClass, predicate=inspect.ismethod):
    if not method_name.startswith("_"): # Skip default methods
        method(solutionClass)
`;
};

const RUNNTER_TERMPLATES = {
  python: makePythonRunnerTemplate,
};

export const makeCodeRunnable = (code, language, inputFilePath) => {
  return RUNNTER_TERMPLATES[language](code, inputFilePath);
};
