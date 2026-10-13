<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Participant lifecycle rules live in `src/lib/lifecycle.ts` (`canPerform`; `openDocumentationVisit`/`isVisitOpen` mirror the `study_visit_available` DB function, so forms never fall back to a closed visit) and are mirrored by the `enforce_participant_enrolment_rules` database trigger — change both together, because the database is the final guard against invalid transitions.
- Lifecycle server functions re-read the participant row after every write and return that, so the UI only ever shows persisted state.
- Auth forms stay disabled until hydration and use `method="post"`, so a pre-hydration submit can never leak credentials into the URL.
- Clinical instrument content (DN4, NePIQoL, PCNE V9.1) lives only in `src/lib/instruments.ts`; PCNE codes are also enforced by the `validate_drp_pcne_codes` trigger — change both together.
- NePIQoL answers are stored and scored by position (1–5); display labels never change that meaning, so correcting the per-item mapping needs no data migration.
- Only `has_role`, `is_research_staff` (RLS helpers; answer only for `auth.uid()`) and `allocate_study_participant` (checks staff role internally) may be SECURITY DEFINER and callable by signed-in users; every other helper is SECURITY INVOKER or trigger-only with EXECUTE revoked, so RLS stays the access boundary.
- The research Excel export (`src/lib/export.functions.ts`) checks `is_research_staff` and then reads only through the caller's RLS client, never the admin client, and excludes account IDs/profiles/roles; worksheet list and approval status live in `src/lib/export-spec.ts` so the page and file never disagree.
- Participant PDF reports: data in `report.functions.ts`, pure mapping in `report-model.ts` (tested), layout in `pdf-report.ts` (pdf-lib: pure JS, runs on Workers); built server-side after `is_research_staff`, every query scoped to the validated participant ID via the caller's RLS client. Audit: `docs/pdf-export-completeness-audit.md`.

- Research dashboard, analytics page and export summary sheets all derive from one pure aggregator (`src/lib/analytics.ts`, fed by RLS-scoped reads after an `is_research_staff` check) so they never disagree; it returns null for anything not calculable.
- Randomisation overrides go only through the `override_participant_allocation` SECURITY DEFINER function (checks research staff + `randomisation_override` in `user_permissions` via `has_permission`), which writes an immutable `allocation_overrides` row, updates `participants.study_group` and an `audit_events` entry in one transaction; the allocation lock trigger only permits a group change matching an override row from the same transaction. `randomizations` stays the untouched original; `participants.study_group` is the current allocation used by analytics, exports and reports — so the original is always recoverable and no second allocation source exists.
- `user_permissions` holds fine-grained permissions separate from roles; it is granted only by administrators through the backend (no client write access), so no user can grant themselves a permission.
- Research accounts are created only by the protected `/api/public/admin/provision-researchers` endpoint from server secrets (`RESEARCH_TEAM_EMAIL`/`RESEARCH_TEAM_PASSWORD`, optional `RESEARCH_TEAM_ROLE`, extra `RESEARCH_ACCOUNTS` with stable `key` in app_metadata); public sign-up is off and the endpoint never grants permissions, so no one becomes research staff by registering.
- Medicine catalogue data lives only in `src/data/medicine-catalogue.json` (typed/searched in `src/lib/medicine-catalogue.ts`).

- Page-copy and patient-area rules live in `src/content/AGENTS.md`; patient language rules in `src/i18n/AGENTS.md`.
- Synthetic QA participants carry `participants.is_test_record` (set only at registration, locked by `participants_lock_test_flag`); analytics, dashboard and study export drop them and their child rows via `splitByDataset` (`src/lib/test-records.ts`), and they are deleted only by the operator-only `qa_cleanup_synthetic_batch` (test flag + batch tag, dry run, exact confirmation; see `docs/synthetic-qa-cleanup.md`), so test data never reaches real figures and cleanup never reaches real participants.

- Randomisation Configuration (`randomisation-config.functions.ts`) is read-only (settings fixed in `allocate_study_participant`). Admins Access (`admin-access.functions.ts`) is a second, server-verified sign-in from server secrets (PBKDF2 hash, encrypted time-limited cookie bound to the research user, rate-limited) whose corrections use service-role-only `admin_correct_participant_allocation` — so the shared login never needs `randomisation_override`.
- Drug interactions and DRPs are researcher documentation allowed at any time: a new record links to the open visit, otherwise `milestone` is NULL ("Outside scheduled visit"); edits never change visit or participant. Enforced in `saveResearchRecord` and the `enforce_study_record` trigger — change both together, so no record is ever silently filed under a closed visit.
