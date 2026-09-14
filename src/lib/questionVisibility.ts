/** Content-audit finding: every question-serving route built its own `questions`
 *  query directly, and none of them checked validation_status at all — a row marked
 *  'rejected' (confirmed factually wrong, or its figure irreparably mismatched to the
 *  question) was served exactly like any other question. This is the shared list of
 *  statuses that must NEVER be served to a student, used identically by every one of
 *  those routes (api/questions/random, api/sessions/start-exam, api/srs/next,
 *  api/srs/review, api/flashcards) so the exclusion can't drift between them.
 *
 *  Deliberately narrow — it excludes only "never show this," not everything short of
 *  'approved'/'verified'. The bulk of the bank is still 'legacy' and hasn't been
 *  individually re-verified yet; pulling all of it from rotation before that audit is
 *  actually done would be a destructive, unreviewed change to the live product, not a
 *  safety improvement. 'disabled' isn't a value the current validation_status CHECK
 *  constraint allows yet — listed here so the exclusion is already correct the moment
 *  a future migration adds it as a real status. */
export const HIDDEN_VALIDATION_STATUSES = ['rejected', 'retired', 'disabled'] as const

/** Postgrest `.not(column, 'in', ...)` expects this exact `(a,b,c)` literal form. */
export const HIDDEN_VALIDATION_STATUSES_FILTER = `(${HIDDEN_VALIDATION_STATUSES.join(',')})`
