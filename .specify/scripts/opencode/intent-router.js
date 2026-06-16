#!/usr/bin/env node
/**
 * Intent Router v2 — the "just say what you want" classifier for Flux Merge.
 *
 * Analyzes natural language input and routes to the correct SpecKit workflow.
 * Uses a priority-based classification system with conflict resolution.
 *
 * Usage: node intent-router.js "<your request>"
 *
 * Output (JSON on stdout, logs to stderr):
 * {
 *   "intent": "full-cycle" | "fix" | "specify" | "plan" | "clarify" | "checklist" | "analyze" | "unknown",
 *   "confidence": 0.0–1.0,
 *   "steps": ["speckit.*", ...],
 *   "spec_keywords": "...",
 *   "reasoning": "..."
 * }
 */

function main() {
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    process.stderr.write('[IntentRouter] No input provided.\n');
    process.stdout.write(JSON.stringify({
      intent: 'unknown', confidence: 0, steps: ['speckit.clarify'],
      spec_keywords: '', reasoning: 'No input provided. Please describe what you want.'
    }) + '\n', () => process.exit(0));
    return;
  }

  const lower = input.toLowerCase();

  // --- INTENT PATTERNS (ordered by specificity) ---
  // Each pattern has: priority (higher = more specific), intent label, regex
  const patterns = [
    // === HIGH PRIORITY: Strong signals (specific keywords) ===

    // Checklist: explicit QA/verification requests
    { priority: 5, intent: 'checklist', pattern: /\b(checklist|qa)\b/ },
    { priority: 4, intent: 'checklist', pattern: /\b(verify|validate|confirm|audit|inspect|verification|validation|inspection)\b/ },
    { priority: 3, intent: 'checklist', pattern: /is\s+(it\s+)?(done|complete|ready)/ },
    { priority: 3, intent: 'checklist', pattern: /run\s+(a\s+)?(checklist|qa)/ },

    // Analysis: status/progress/evaluation
    { priority: 5, intent: 'analyze', pattern: /\b(analyze|analysis)\b/ },
    { priority: 4, intent: 'analyze', pattern: /\b(review|evaluate|assess|assessment)\b/ },
    { priority: 5, intent: 'analyze', pattern: /(what'?s\s+the\s+|current\s+)?(status|progress)\b/ },
    { priority: 4, intent: 'analyze', pattern: /how\s+(far|complete|much|many|is\s+it\s+going)/ },
    { priority: 3, intent: 'analyze', pattern: /does\s+(it|this)\s+(meet|comply|pass)/ },

    // Clarify: confusion, questions
    { priority: 5, intent: 'clarify', pattern: /\b(clarify|clarification|clarity|confus|unclear|ambiguous|conflict|unspecif|unsure)\b/ },
    { priority: 4, intent: 'clarify', pattern: /\b(question|explain)\b/ },
    { priority: 3, intent: 'clarify', pattern: /(i\s+don'?t\s+understand|help\s+me\s+understand)/ },

    // Fix: bugs, crashes, broken things
    { priority: 5, intent: 'fix', pattern: /\b(bug|broken|crash|failing|hotfix|regression)\b/ },
    { priority: 4, intent: 'fix', pattern: /\b(fix|error|issue|repair|patch|resolve|bugfix)\b/ },
    { priority: 3, intent: 'fix', pattern: /(not\s+working|doesn'?t\s+work|failed)/ },

    // Plan: roadmap, decomposition
    { priority: 5, intent: 'plan', pattern: /\b(roadmap|decompose|break\s+down)\b/ },
    { priority: 4, intent: 'plan', pattern: /\b(plan|steps|todo)\b/ },
    { priority: 3, intent: 'plan', pattern: /how\s+(do|should|would|can)\s+(we|i)\s+(implement|build|add)/ },

    // Specify: documentation, design
    { priority: 5, intent: 'specify', pattern: /\b(spec|specify|specification)\b/ },
    { priority: 4, intent: 'specify', pattern: /\b(design)\s+(a\s+|an\s+|the\s+|a\s+new\s+)?\w+/ },
    { priority: 4, intent: 'specify', pattern: /\b(define)\s+(the|a|an)/ },
    { priority: 3, intent: 'specify', pattern: /write\s+(a\s+)?spec/ },

    // === MEDIUM PRIORITY: General feature requests ===
    // Full-cycle: general "add/implement X" with any subject
    { priority: 3, intent: 'full-cycle', pattern: /\b(add|create|build|implement)\s+(a\s+|an\s+)?\w+/ },
    { priority: 2, intent: 'full-cycle', pattern: /i\s+want\s+(to\s+)?(add|create|build|implement)\b/ },
    { priority: 2, intent: 'full-cycle', pattern: /\b(new\s+)?(feature|enhancement|capability)\b/ },

    // === LOW PRIORITY: Fallback generic matches ===
    { priority: 1, intent: 'specify', pattern: /\b(spec|design)\b/ },
    { priority: 1, intent: 'fix', pattern: /\b(issue|problem)\b/ },
  ];

  // --- SCORING ---
  // For each intent, track: max priority seen, total matches
  const scores = {};
  for (const { priority, intent } of patterns) {
    if (!scores[intent]) scores[intent] = { maxPriority: 0, count: 0 };
  }

  for (const { priority, intent, pattern } of patterns) {
    if (pattern.test(lower)) {
      scores[intent].maxPriority = Math.max(scores[intent].maxPriority, priority);
      scores[intent].count += 1;
    }
  }

  // --- CONFLICT RESOLUTION ---
  // Pick the intent with the highest max priority. On tie, pick the one with more matches.
  let bestIntent = 'unknown';
  let bestMaxPriority = 0;
  let bestCount = 0;

  for (const [intent, { maxPriority, count }] of Object.entries(scores)) {
    if (maxPriority > bestMaxPriority || (maxPriority === bestMaxPriority && count > bestCount)) {
      bestIntent = intent;
      bestMaxPriority = maxPriority;
      bestCount = count;
    }
  }

  // --- BUILD STEP SEQUENCE ---
  const stepMap = {
    'full-cycle': ['speckit.specify', 'speckit.plan', 'speckit.tasks', 'speckit.implement', 'speckit.checklist', 'speckit.analyze'],
    'fix':        ['speckit.plan', 'speckit.tasks', 'speckit.implement', 'speckit.analyze'],
    'specify':    ['speckit.specify'],
    'plan':       ['speckit.plan'],
    'clarify':    ['speckit.clarify'],
    'checklist':  ['speckit.checklist'],
    'analyze':    ['speckit.analyze'],
    'unknown':    ['speckit.clarify'],
  };

  const confidence = bestMaxPriority > 0 ? Math.min(1, bestMaxPriority / 5) : 0;
  const steps = stepMap[bestIntent] || stepMap['unknown'];

  // Extract meaningful keywords from the request
  const stopWords = new Set([
    'the','a','an','is','it','at','on','in','to','for','of','and','or',
    'with','by','from','as','be','this','that','i','you','we','they',
    'can','do','did','will','would','could','should','has','have','had',
    'not','no','but','so','if','then','than','too','very','just','about',
    'please','want','need','like','help','me','my','your','some','all',
    'up','down','out','off','over','into','through','during','before',
    'after','above','below','between','let','get','go','make','run'
  ]);
  const words = input.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  const spec_keywords = [...new Set(words)].slice(0, 8).join(' ');

  const reasoning = bestMaxPriority > 0
    ? `Intent '${bestIntent}' (priority: ${bestMaxPriority}, matches: ${bestCount}). Route: ${steps.join(' → ')}. Keywords: ${spec_keywords}`
    : `No clear intent detected. Defaulting to clarification. Keywords: ${spec_keywords}`;

  process.stderr.write(`[IntentRouter] ${reasoning}\n`);
  process.stdout.write(JSON.stringify({
    intent: bestIntent,
    confidence: Math.round(confidence * 100) / 100,
    steps,
    spec_keywords: spec_keywords.substring(0, 120),
    reasoning
  }) + '\n', () => process.exit(0));
}

main();
