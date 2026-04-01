/**
 * ALGORITHM STEP GENERATORS
 * Converts trace text and algorithm data into visualization steps
 */

/**
 * Generate visualization steps for Count Palindromic Substrings
 * @param {string} inputString - The input string (e.g., "abc")
 * @param {string} traceText - The trace text from problem JSON
 * @returns {Array} Array of step objects for visualization
 */
export function generatePalindromeSteps(inputString, traceText) {
    if (!inputString || !traceText) {
        return [];
    }

    const steps = [];
    const lines = traceText.split('\n').filter(line => line.trim().length > 0);
    
    let currentCount = 0;
    let stepNumber = 0;

    // Parse each line from the trace
    for (const line of lines) {
        // Skip header lines
        if (line.includes('String:') || line.includes('Length:') || line.includes('Total palindromic')) {
            continue;
        }

        // Match pattern: "1. "a" (indices 0-0): Check palindrome: single char → YES, count=1"
        const substringMatch = line.match(/"([^"]*)"\s*\(.*?(\d+)-(\d+)\).*?(YES|NO).*?count=(\d+)/);
        
        if (substringMatch) {
            const [, substring, leftIdx, rightIdx, result, count] = substringMatch;
            currentCount = parseInt(count);
            const leftIndex = parseInt(leftIdx);
            const rightIndex = parseInt(rightIdx);
            const isPalindrome = result === 'YES';

            // Determine if it's a single character or needs comparison
            const isSingleChar = leftIndex === rightIndex;

            // Step 1: Initial state - show substring selection
            steps.push({
                stepNumber: stepNumber++,
                type: 'substring-selection',
                substring,
                leftIndex,
                rightIndex,
                leftChar: inputString[leftIndex],
                rightChar: inputString[rightIndex],
                isMatching: null,
                isPalindrome: false,
                comparingPhase: false,
                isSingleChar,
                description: `Checking substring "${substring}" (indices ${leftIndex}-${rightIndex})`,
                count: currentCount - (isPalindrome ? 1 : 0), // Count before this palindrome
            });

            // Step 2: If not single char, show comparison
            if (!isSingleChar) {
                const isMatching = inputString[leftIndex] === inputString[rightIndex];
                steps.push({
                    stepNumber: stepNumber++,
                    type: 'comparison',
                    substring,
                    leftIndex,
                    rightIndex,
                    leftChar: inputString[leftIndex],
                    rightChar: inputString[rightIndex],
                    isMatching,
                    isPalindrome: false,
                    comparingPhase: true,
                    isSingleChar: false,
                    description: `Comparing '${inputString[leftIndex]}' vs '${inputString[rightIndex]}' → ${isMatching ? 'MATCH' : 'NO MATCH'}`,
                    count: currentCount - (isPalindrome ? 1 : 0),
                });
            }

            // Step 3: Result
            steps.push({
                stepNumber: stepNumber++,
                type: 'result',
                substring,
                leftIndex,
                rightIndex,
                leftChar: inputString[leftIndex],
                rightChar: inputString[rightIndex],
                isMatching: isSingleChar ? true : (inputString[leftIndex] === inputString[rightIndex]),
                isPalindrome,
                comparingPhase: !isSingleChar,
                isSingleChar,
                description: `"${substring}" is ${isPalindrome ? 'a palindrome' : 'not a palindrome'} → count=${currentCount}`,
                count: currentCount,
            });
        }
    }

    return steps;
}

/**
 * Generate steps for Generate Valid Parentheses visualization
 */
export function generateParenthesesSteps(n, traceText) {
    const steps = [];
    let stepNumber = 0;

    // Normalize the trace text to handle both \n and inline "Step X:"
    // This regex matches "Step 1: <text>" up until the next "Step X:" or end of string.
    const stepRegex = /Step \d+:([^]*?)(?=Step \d+:|$)/g;
    let match;
    let depth = 0;

    while ((match = stepRegex.exec(traceText)) !== null) {
        const description = match[1].trim();
        if (!description) continue;

        // Try to find the built string. In the trace it usually appears as s='()' or → '()' or validate '()'
        // Let's capture all quoted sequences of brackets and use the longest/last meaningful one.
        const matches = [...description.matchAll(/'([()]*)'/g)];
        let currentStr = '';
        if (matches.length > 0) {
            // The last string in quotes is usually the resulting string of the step
            currentStr = matches[matches.length - 1][1];
        } else if (description.includes("s=''") || description.includes("empty string ''")) {
            currentStr = '';
        }

        // Determine action
        let action = 'explore';
        if (description.toLowerCase().includes('add \'(\'')) action = 'add-open';
        else if (description.toLowerCase().includes('add \')\'')) action = 'add-close';
        else if (description.toLowerCase().includes('backtrack')) action = 'explore';

        let isValid = null;
        if (description.toLowerCase().includes('valid')) {
            const lower = description.toLowerCase();
            if (lower.includes('invalid')) {
                isValid = false;
            } else if (lower.includes('→ valid') || lower.includes('is valid') || (!lower.includes('not valid') && lower.includes('valid'))) {
                isValid = true;
            }
            action = 'validate';
        }

        steps.push({
            stepNumber: stepNumber++,
            type: action,
            currentString: currentStr,
            n,
            isValid,
            description: description,
            depth,
        });

        if (action === 'add-open') depth++;
        if (action === 'add-close') depth--;
    }

    return steps.length > 0 ? steps : generateDefaultParenthesesSteps(n);
}

function generateDefaultParenthesesSteps(n) {
    const steps = [];
    const results = [];
    let stepNumber = 0;

    function backtrack(open, close, current) {
        if (current.length === 2 * n) {
            results.push(current);
            steps.push({
                stepNumber: stepNumber++,
                type: 'found',
                currentString: current,
                isValid: true,
                description: `Found valid combination: "${current}"`,
                n,
            });
            return;
        }

        if (open < n) {
            steps.push({
                stepNumber: stepNumber++,
                type: 'add-open',
                currentString: current + '(',
                description: `Add '(' → "${current}("`,
                n,
            });
            backtrack(open + 1, close, current + '(');
        }

        if (close < open) {
            steps.push({
                stepNumber: stepNumber++,
                type: 'add-close',
                currentString: current + ')',
                description: `Add ')' → "${current})"`,
                n,
            });
            backtrack(open, close + 1, current + ')');
        }
    }

    backtrack(0, 0, '');
    return steps;
}

/**
 * Generate steps for Longest Common Prefix visualization
 */
export function generateLCPSteps(inputStrings, traceText) {
    const steps = [];
    let stepNumber = 0;

    const lines = traceText.split('\n').filter(l => l.trim().length > 0);
    
    for (const line of lines) {
        // Skip input/output headers
        if (line.includes('Input:') || line.includes('Output:') || line.includes('Step 1: Find')) {
            continue;
        }

        // Match "Step X: Position Y: Compare..."
        if (line.includes('Position')) {
            const posMatch = line.match(/Position (\d+):/);
            if (posMatch) {
                const position = parseInt(posMatch[1]);
                const isMatch = line.includes('All match') || line.includes('match.');
                const chars = [];
                
                // Extract characters from each string at this position
                for (const str of inputStrings) {
                    if (position < str.length) {
                        chars.push(str[position]);
                    }
                }

                steps.push({
                    stepNumber: stepNumber++,
                    type: 'compare-position',
                    position,
                    chars,
                    strings: inputStrings,
                    isMatch,
                    description: line.replace(/\s+/g, ' ').trim(),
                });
            }
        }
    }

    return steps.length > 0 ? steps : generateDefaultLCPSteps(inputStrings);
}

function generateDefaultLCPSteps(inputStrings) {
    const steps = [];
    let stepNumber = 0;

    if (!inputStrings || inputStrings.length === 0) return steps;

    let prefix = '';
    const minLen = Math.min(...inputStrings.map(s => s.length));

    for (let i = 0; i < minLen; i++) {
        const char = inputStrings[0][i];
        const allMatch = inputStrings.every(s => s[i] === char);

        if (allMatch) {
            prefix += char;
            steps.push({
                stepNumber: stepNumber++,
                type: 'match',
                position: i,
                char,
                prefix,
                description: `Position ${i}: All strings have '${char}' → Prefix = "${prefix}"`,
            });
        } else {
            steps.push({
                stepNumber: stepNumber++,
                type: 'mismatch',
                position: i,
                char,
                prefix,
                description: `Position ${i}: Mismatch found → Return prefix = "${prefix}"`,
            });
            break;
        }
    }

    return steps;
}

/**
 * Generate steps for Normalize & Deduplicate Usernames visualization
 */
export function generateNormalizeUserSteps(usernames, traceText) {
    const steps = [];
    let stepNumber = 0;
    const seen = new Set();

    for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        
        // Step 1: Start processing
        steps.push({
            stepNumber: stepNumber++,
            type: 'process-start',
            username,
            index: i,
            description: `Processing username "${username}"`,
        });

        // Step 2: Lowercase
        const lowercase = username.toLowerCase();
        steps.push({
            stepNumber: stepNumber++,
            type: 'lowercase',
            username,
            result: lowercase,
            description: `Lowercase: "${username}" → "${lowercase}"`,
        });

        // Step 3: Remove dots
        const noDots = lowercase.replace(/\./g, '');
        steps.push({
            stepNumber: stepNumber++,
            type: 'remove-dots',
            username,
            result: noDots,
            description: `Remove dots: "${lowercase}" → "${noDots}"`,
        });

        // Step 4: Truncate after +
        const plusIdx = noDots.indexOf('+');
        const normalized = plusIdx !== -1 ? noDots.substring(0, plusIdx) : noDots;
        steps.push({
            stepNumber: stepNumber++,
            type: 'truncate',
            username,
            result: normalized,
            description: `${plusIdx !== -1 ? 'Truncate' : 'No truncation'}: "${noDots}" → "${normalized}"`,
        });

        // Step 5: Check for duplicates
        const isDuplicate = seen.has(normalized);
        steps.push({
            stepNumber: stepNumber++,
            type: 'check-duplicate',
            username,
            normalized,
            isDuplicate,
            uniqueCount: isDuplicate ? seen.size : seen.size + 1,
            description: isDuplicate 
                ? `Duplicate found! "${normalized}" already seen → Skip`
                : `New unique username: "${normalized}" → Count = ${seen.size + 1}`,
        });

        if (!isDuplicate) {
            seen.add(normalized);
        }
    }

    return steps;
}

/**
 * Generate steps for Regex Matching visualization
 */
export function generateRegexSteps(s, p, traceText) {
    const steps = [];
    let stepNumber = 0;

    const lines = traceText.split('\n').filter(l => l.trim().length > 0);

    for (const line of lines) {
        if (line.includes('Step')) {
            const stepMatch = line.match(/Step (\d+):(.*)/);
            if (stepMatch) {
                const [, num, description] = stepMatch;
                
                // Extract indices if available
                const idxMatch = description.match(/i=(\d+).*j=(\d+)/);
                const sIdx = idxMatch ? parseInt(idxMatch[1]) : -1;
                const pIdx = idxMatch ? parseInt(idxMatch[2]) : -1;

                let action = 'compare';
                if (description.includes('valid')) action = 'validate';
                if (description.includes('→ YES')) action = 'match';
                if (description.includes('→ NO')) action = 'no-match';

                steps.push({
                    stepNumber: stepNumber++,
                    type: action,
                    sIndex: sIdx,
                    pIndex: pIdx,
                    sChar: sIdx >= 0 && sIdx < s.length ? s[sIdx] : null,
                    pChar: pIdx >= 0 && pIdx < p.length ? p[pIdx] : null,
                    description: description.trim(),
                    s,
                    p,
                });
            }
        }
    }

    return steps;
}

/**
 * Alternative: Generate palindrome steps from input directly (without trace text)
 * Useful for dynamic generation
 */
export function generatePalindromeStepsFromInput(inputString) {
    if (!inputString) return [];

    const steps = [];
    const n = inputString.length;
    let count = 0;
    let stepNumber = 0;

    // Generate all substrings
    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            const substring = inputString.substring(i, j + 1);
            const isPalindrome = checkPalindrome(inputString, i, j);

            if (isPalindrome) {
                count++;
            }

            const isSingleChar = i === j;

            // Step 1: Substring selection
            steps.push({
                stepNumber: stepNumber++,
                type: 'substring-selection',
                substring,
                leftIndex: i,
                rightIndex: j,
                leftChar: inputString[i],
                rightChar: inputString[j],
                isMatching: null,
                isPalindrome: false,
                comparingPhase: false,
                isSingleChar,
                description: `Checking substring "${substring}" (indices ${i}-${j})`,
                count: count - (isPalindrome ? 1 : 0),
            });

            // Step 2: Comparison (if not single char)
            if (!isSingleChar) {
                const isMatching = inputString[i] === inputString[j];
                steps.push({
                    stepNumber: stepNumber++,
                    type: 'comparison',
                    substring,
                    leftIndex: i,
                    rightIndex: j,
                    leftChar: inputString[i],
                    rightChar: inputString[j],
                    isMatching,
                    isPalindrome: false,
                    comparingPhase: true,
                    isSingleChar: false,
                    description: `Comparing '${inputString[i]}' vs '${inputString[j]}' → ${isMatching ? 'MATCH' : 'NO MATCH'}`,
                    count: count - (isPalindrome ? 1 : 0),
                });
            }

            // Step 3: Result
            steps.push({
                stepNumber: stepNumber++,
                type: 'result',
                substring,
                leftIndex: i,
                rightIndex: j,
                leftChar: inputString[i],
                rightChar: inputString[j],
                isMatching: isSingleChar ? true : (inputString[i] === inputString[j]),
                isPalindrome,
                comparingPhase: !isSingleChar,
                isSingleChar,
                description: `"${substring}" is ${isPalindrome ? 'a palindrome' : 'not a palindrome'} → count=${count}`,
                count,
            });
        }
    }

    return steps;
}

/**
 * Helper: Check if substring is palindrome
 */
function checkPalindrome(str, left, right) {
    while (left < right) {
        if (str[left] !== str[right]) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}

/**
 * Generate steps for binary search visualization
 */
export function generateBinarySearchSteps(inputArray, target) {
    const steps = [];
    let left = 0;
    let right = inputArray.length - 1;
    let stepNumber = 0;
    let found = false;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        // Step 1: Calculate mid
        steps.push({
            stepNumber: stepNumber++,
            type: 'mid-calculation',
            array: inputArray,
            leftIndex: left,
            rightIndex: right,
            midIndex: mid,
            activeIndex: mid,
            description: `Calculating mid: (${left} + ${right}) / 2 = ${mid}`,
            current: inputArray[mid],
            target,
        });

        // Step 2: Comparison
        if (inputArray[mid] === target) {
            steps.push({
                stepNumber: stepNumber++,
                type: 'found',
                array: inputArray,
                leftIndex: left,
                rightIndex: right,
                midIndex: mid,
                activeIndex: mid,
                description: `Found! ${inputArray[mid]} === ${target}`,
                current: inputArray[mid],
                target,
            });
            found = true;
            break;
        } else if (inputArray[mid] < target) {
            steps.push({
                stepNumber: stepNumber++,
                type: 'comparison',
                array: inputArray,
                leftIndex: left,
                rightIndex: right,
                midIndex: mid,
                activeIndex: mid,
                description: `${inputArray[mid]} < ${target}, search right half`,
                current: inputArray[mid],
                target,
            });
            left = mid + 1;
        } else {
            steps.push({
                stepNumber: stepNumber++,
                type: 'comparison',
                array: inputArray,
                leftIndex: left,
                rightIndex: right,
                midIndex: mid,
                activeIndex: mid,
                description: `${inputArray[mid]} > ${target}, search left half`,
                current: inputArray[mid],
                target,
            });
            right = mid - 1;
        }
    }

    if (!found) {
        steps.push({
            stepNumber: stepNumber++,
            type: 'not-found',
            array: inputArray,
            description: `Not found. left=${left} > right=${right}`,
            target,
        });
    }

    return steps;
}

/**
 * Generate steps for linear search visualization
 */
export function generateLinearSearchSteps(inputArray, target) {
    const steps = [];
    let stepNumber = 0;

    for (let i = 0; i < inputArray.length; i++) {
        // Step 1: Check element
        steps.push({
            stepNumber: stepNumber++,
            type: 'comparison',
            array: inputArray,
            activeIndex: i,
            description: `Check element at index ${i}: ${inputArray[i]}`,
            current: inputArray[i],
            target,
        });

        // Step 2: Found or continue
        if (inputArray[i] === target) {
            steps.push({
                stepNumber: stepNumber++,
                type: 'found',
                array: inputArray,
                activeIndex: i,
                description: `Found! ${inputArray[i]} === ${target} at index ${i}`,
                current: inputArray[i],
                target,
            });
            break;
        }
    }

    return steps;
}

/**
 * Generate steps for Valid Palindrome (Two Pointers) visualization
 */
export function generateValidPalindromeSteps(inputString, traceText) {
    if (!inputString || !traceText) return [];

    const steps = [];
    let stepNumber = 0;
    const lines = traceText.split('\n').filter(l => l.trim().length > 0);

    // Filter out quotes around the string if present
    const cleanInput = inputString.replace(/^["']|["']$/g, '');

    // Initial state
    steps.push({
        stepNumber: stepNumber++,
        type: 'initial',
        description: `Checking "${cleanInput}"`,
        left: 0,
        right: Math.max(0, cleanInput.length - 1),
        matchStatus: null,
        inputString: cleanInput
    });

    for (const line of lines) {
        if (line.includes('Step')) {
            // "Step 1: left=0 ('r'), right=6 ('r') → match"
            const match = line.match(/left=(\d+).*right=(\d+)/);
            if (match) {
                const left = parseInt(match[1]);
                const right = parseInt(match[2]);
                const matchStatus = line.includes('match') ? 'match' : (line.includes('loop ends') ? 'end' : 'mismatch');
                steps.push({
                    stepNumber: stepNumber++,
                    type: 'compare',
                    description: line.substring(line.indexOf('Step')).trim(),
                    left,
                    right,
                    matchStatus,
                    inputString: cleanInput
                });
            }
        } else if (line.includes('→')) {
            // "All characters matched → Palindrome" or "Mismatch found → Not Palindrome"
            steps.push({
                stepNumber: stepNumber++,
                type: 'result',
                description: line.trim(),
                isPalindrome: line.includes('Palindrome') && !line.includes('Not Palindrome'),
                left: -1,
                right: -1,
                matchStatus: null,
                inputString: cleanInput
            });
        }
    }

    return steps;
}

export default {
    generateValidPalindromeSteps,
    generatePalindromeSteps,
    generatePalindromeStepsFromInput,
    generateParenthesesSteps,
    generateLCPSteps,
    generateNormalizeUserSteps,
    generateRegexSteps,
    generateBinarySearchSteps,
    generateLinearSearchSteps,
};
