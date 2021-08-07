# How to run
[ ] **Install the extension**. Go to `chrome://extensions`, enable "Developer Mode" if you haven't, then drag the extension folder onto the webpage to install it.
[ ] **Request access**. Request access for authenticating into the extension and the spreadsheet. Go to the spreadsheet at "https://docs.google.com/spreadsheets/d/1FVOJCeA4lmADL2pk1ttGg4GEbn_4QPfbeF6_bCviAY8/edit#gid=0" and request for access, then I can grant you the needed permissions.
[ ] **Use the tool**. Accept apps script's scopes when first run the tool. After that try running your command again since it would be discarded.

# Basic usage flow
- **Initialize**. Click the extension and press "Authorize" to initialize the tool.
- **Add inputs**. You go to the spreadsheet, add any rows from column 2 to column 4 ("url" to "comment" columns). 
- **Select inputs to process**. Select the final row you want to process, so the tool will process the rows from first the that row.
- **Run the tool**. In the toolbar menu, click the "Youtube Commentor Tool" menu and select "Work". The GAS will validate the data then show you a dialog box from which you can start the process and see the progress.
- **Press the "Start" button** to actually begin the automation.

# How to use the contained spreadsheet
- This spreadsheet at "https://docs.google.com/spreadsheets/d/1FVOJCeA4lmADL2pk1ttGg4GEbn_4QPfbeF6_bCviAY8/edit#gid=0" is where you type the youtube URL, timeout and comment to execute. It also keeps your comment URL. 
- The "comments" column can be randomized from a comment box which is on the far right of the spreadsheet, using excel formula. If you need more comments, add rows under the "comment box" then change range in the formula.

# Current drawbacks
- User **must** focus on other window before the tool make comment. Otherwise it won't work.
- Spreadsheet column orders must not be changed.
- Google puts many constraints: daily token limit of 10000, test users of 100. Publishing app requires verification.
- Can only have 20 schedules. After that clearing all triggers is needed.
