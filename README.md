# How to run
[ ] **Install the extension**. Go to `chrome://extensions`, enable "Developer Mode" if you haven't, then drag the extension folder onto the webpage to install it.
[ ] **Request access**. Request access for authenticating into the extension and the spreadsheet. Go to the spreadsheet at "https://docs.google.com/spreadsheets/d/1R3jimjh9BJ9uuxTiq1tDLRfWx7_3l7JPz61vmhQv9iE/edit" and request for access, then I can grant you the needed permissions.
[ ] **Use the tool**. Accept apps script's scopes when first run the tool. After that try running your command again since it would be discarded.

# Basic usage flow
- **Initialize**. Click the extension and press "Authorize" to initialize the tool.
- **Add inputs**. Go to the spreadsheet, Select **"File"** --> **"Upload"** --> Select or drop *the input file* [1] --> Set **"Import location"** to *"Append to current sheet"* [2], **uncheck** the checkbox saying *"Convert text to numbers, dates , and formulas"*, set **"Separator type"** to *"Custom"* then, set the value in **"Custom separator"** to our *pipe charater '|'* --> Finally, press **"Import data"**.
- **Select inputs to process**. Select the final row you want to process, so the tool will process the rows from first the that row.
- **Run the tool**. In the toolbar menu, click the "Youtube Commentor Tool" menu and select "Work". The GAS will validate the data then show you a dialog box from which you can start the process and see the progress.
- **Press the "Start" button** to actually begin the automation.

# How to use the contained spreadsheet
- This spreadsheet at "https://docs.google.com/spreadsheets/d/1R3jimjh9BJ9uuxTiq1tDLRfWx7_3l7JPz61vmhQv9iE/edit" is where you type the youtube URL, timeout and comment to execute. It also keeps your comment URL. 
- The "comments" column can be randomized from a comment box which is on the far right of the spreadsheet, using excel formula. If you need more comments, add rows under the "comment box" then change range in the formula.

# Current drawbacks
- Spreadsheet column orders must not be changed.
- Google puts many constraints: daily token limit of 10000, test users of 100. Publishing app requires verification.

# [1] Input file format
- One row of data contains 2 fields (post URL and comment content), separated by a pipe character '|' without any spaces around it. E.g. `https://www.facebook.com/groups/351122206629977/posts/351122309963300/|My comment goes here.\nSend me some emails!`.
- Each row of data is separated by a new line character '\n', in other words, each line contains one row of data with the format as said above.
- If your comment has several paragraphs, ends each paragraph with a new line character '\n' like this: `My comment goes here.\nSend me some emails!`.

# [2] Append to current sheet
- This means the Google Sheets will append all data from the cell at (last row + 1, A) to (last row + input's rows, 'A'+input row's columns count). **So basically, all previous data is safe.****stupid edition**
