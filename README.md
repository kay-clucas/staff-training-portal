# Staff Training Portal

A Google Apps Script training platform for cybersecurity awareness and child safeguarding, with interactive lessons, assessments, completion tracking and an administration dashboard.

This portfolio copy preserves the original course structure, application logic and interface. Organisation names, personal details, domains, policy links and organisation assets have been replaced with fictional examples. Incident examples are presented as scenarios. All example contact details and policy destinations are placeholders.

## Features

- Cybersecurity and safeguarding courses with interactive scenarios and assessments.
- Course selection, progress tracking and annual recertification.
- Google Sheets results workbook and compliance reporting.
- Staff roster synchronisation through Google Workspace groups and Directory.
- Role-based administration and school-level reporting.
- Reminder emails, scheduled jobs and dry-run setup tools.
- Routing between deployments in separate Google Workspaces.
- Responsive interface with light and dark themes.

## Source

| Files | Purpose |
| --- | --- |
| `Config.gs` | Organisation, audience, school and deployment configuration |
| `Content.gs`, `CourseSafeguarding.gs` | Training content and assessments |
| `Courses.gs`, `Code.gs` | Course registry, web entry points and result handling |
| `Index.html`, `Picker.html` | Learning interface and course selection |
| `Admin.html`, `AdminData.gs`, `Dashboard.gs` | Administration and reporting |
| `Setup.gs`, `Reminders.gs` | Workbook setup, roster refresh and reminders |
| `DeckExport.gs` | Optional training slide export |

## Running your own copy

GitHub stores the source. The backend runs in Google Apps Script; this repository is not a GitHub Pages deployment.

1. Create a **new** standalone Apps Script project in a test Google Workspace. Copy in the `.gs` and `.html` source files, retaining their names and file types.
2. Enable the Admin SDK advanced service if testing roster synchronisation. Review `appsscript.example.json` as a starting manifest; it is a reconstructed example based on the source's scope list, not an export of the original project's settings.
3. Replace the fictional values in `Config.gs` and the safeguarding contacts in `CourseSafeguarding.gs`. Review the existing `CONFIRM` placeholders before using the training with staff.
4. Set deployment-specific Script Properties, including `RESULTS_SHEET_ID`, `ROSTER_GROUP`, `TENANT_KEY`, `DEFAULT_AUDIENCE` and `ROSTER_SCHOOLS` where applicable. Configure an isolated results workbook and test group. Partner deployment URLs and labels are optional and configured through the property names in `TENANT`.
5. Run `setUpResultsSheet()` and `refreshRoster()` first to inspect their dry-run reports. The explicit `RUN_*_FOR_REAL` functions apply changes; reminder and trigger functions should be reviewed before running them.
6. Deploy as an Apps Script web app with access restricted to your intended test audience. Exercise lessons, assessment submission and reporting with test accounts before wider use.

Google's [clasp guide](https://developers.google.com/apps-script/guides/clasp) explains how to manage Apps Script source with Git. Local clasp settings and credentials are intentionally excluded from this repository. Create a new clasp project targeting this folder if you want local synchronisation; do not point this portfolio copy at an existing production project.

## Portfolio validation

The 13 source files were checked for JavaScript syntax, retained lesson and assessment structure, unchanged CSS styling and remaining source identifiers. No live roster, results, Script Properties, deployments, credentials or scheduled jobs are included. Google Workspace integration and runtime behaviour require a separate test deployment and have not been verified in this copy.

The optional slide export retains its original scope guard. It requires the presentations scope in both the manifest and `getManifestScopes_()` before use. The optional Gmail alias mode likewise retains its original scope requirements.
