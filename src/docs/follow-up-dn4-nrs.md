# DN4 and NRS at Day 15 / Day 30

- Day 15 and Day 30 forms show DN4, NRS and NePIQoL, reusing the baseline `Dn4Form`, NRS `InstrumentPanel` and `NepiqolForm`.
- Each record is its own `assessments` row keyed by participant + visit + instrument, so one visit can never overwrite another; completed rows are locked.
- The database rule that limited DN4 to baseline was lifted (migration 0027); scoring is unchanged (server-side `score_dn4`).
- Closing a follow-up still requires NRS and NePIQoL. **Open protocol decision:** whether DN4 is mandatory at follow-ups. Until confirmed it is recorded but not required.
- No DN4 change formula is calculated; reports, Excel and analytics already list DN4 per visit.
