const makePythonRunnerTemplate = (code) => {
  return `import inspect
from typing import *

${code}

solutionClass = Solution()
for method_name, method in inspect.getmembers(solutionClass, predicate=inspect.ismethod):
    if not method_name.startswith("_"): # Skip default methods
        method(solutionClass)
`;
};

const RUNNTER_TERMPLATES = {
  python: makePythonRunnerTemplate,
};

export const makeCodeRunnable = (code, language) => {
  return RUNNTER_TERMPLATES[language](code);
};
