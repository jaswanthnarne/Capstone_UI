import ExcelJS from 'exceljs';

// Helper to save workbook in browser
const saveWorkbook = async (workbook, filename) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Styling definitions
const STYLES = {
  headerFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E3A8A' } // Deep Cobalt Blue
  },
  subheaderFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F1F5F9' } // Very Light Gray
  },
  accentFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '3B82F6' } // Blue Accent
  },
  zebraFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F8FAFC' } // Subtle striping
  },
  whiteFill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF' }
  },
  statusFills: {
    submitted: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } }, // Light Green
    in_progress: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9C3' } }, // Light Yellow
    problem_pending: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } }, // Light Gray
    overdue: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } } // Light Red
  },
  statusTexts: {
    submitted: { color: { argb: '15803D' }, bold: true },
    in_progress: { color: { argb: 'A16207' }, bold: true },
    problem_pending: { color: { argb: '475569' }, bold: true },
    overdue: { color: { argb: 'B91C1C' }, bold: true }
  },
  thinBorder: {
    top: { style: 'thin', color: { argb: 'E2E8F0' } },
    left: { style: 'thin', color: { argb: 'E2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
    right: { style: 'thin', color: { argb: 'E2E8F0' } }
  },
  doubleBottomBorder: {
    bottom: { style: 'double', color: { argb: '000000' } }
  }
};

// Auto-adjust column widths
const autoWidthColumns = (worksheet) => {
  worksheet.columns.forEach(column => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const valStr = cell.value ? String(cell.value) : '';
      if (valStr.length > maxLen) maxLen = valStr.length;
    });
    column.width = Math.max(maxLen + 4, 12);
  });
};

/**
 * 1. Export One Team (2 Sheets: Metadata & Roster + Daily Work Logs)
 */
export const exportTeamExcel = async (team, logs = []) => {
  const workbook = new ExcelJS.Workbook();
  
  // SHEET 1: METADATA & ROSTER
  const sheet1 = workbook.addWorksheet('Metadata & Roster');

  // Title Block
  sheet1.mergeCells('A1:I1');
  const titleCell = sheet1.getCell('A1');
  titleCell.value = `TEAM REPORT: ${team.name.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet1.getRow(1).height = 40;

  // Metadata block
  sheet1.addRow([]);
  sheet1.addRow(['Batch Name:', team.batchId?.name || 'N/A', '', 'Status:', (team.status || 'N/A').toUpperCase()]);
  sheet1.addRow(['College:', team.collegeId?.name || 'N/A', '', 'Project Allocated:', team.problemStatementId?.title || 'None Selected']);
  sheet1.addRow(['Email Account:', team.email, '', 'Change Count:', `${team.problemChangeCount || 0}/3 attempts`]);
  
  [3, 4, 5].forEach(rowIdx => {
    sheet1.getRow(rowIdx).font = { name: 'Segoe UI', size: 10 };
    sheet1.getCell(`A${rowIdx}`).font = { bold: true, color: { argb: '475569' } };
    sheet1.getCell(`D${rowIdx}`).font = { bold: true, color: { argb: '475569' } };
  });

  sheet1.addRow([]);

  // Table Headers
  const tableHeaders = ['Role', 'Student Name', 'USN / Reg Number', 'Email Address', 'Mobile Number', 'Department', 'Division', 'Room Number', 'Course Name'];
  const headerRow = sheet1.addRow(tableHeaders);
  headerRow.height = 25;
  headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = STYLES.accentFill;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Team Lead Data Row
  const leadRow = sheet1.addRow([
    'Team Lead',
    team.leadName || team.leadUsername,
    team.usnRollNumber || '—',
    team.email,
    team.mobile || '—',
    team.dept || '—',
    team.division || '—',
    team.roomNumber || '—',
    team.courseName || '—'
  ]);
  leadRow.height = 22;
  leadRow.eachCell(cell => {
    cell.fill = STYLES.subheaderFill;
    cell.font = { bold: true };
    cell.border = STYLES.thinBorder;
  });

  // Members Data Rows
  (team.members || []).forEach((m, idx) => {
    const row = sheet1.addRow([
      'Member',
      m.name,
      m.rollNumber,
      m.email || '—',
      m.mobile || '—',
      m.dept || '—',
      m.division || '—',
      m.roomNumber || '—',
      m.courseName || '—'
    ]);
    row.height = 20;
    row.eachCell(cell => {
      cell.fill = idx % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;
      cell.border = STYLES.thinBorder;
    });
  });

  autoWidthColumns(sheet1);


  // SHEET 2: DAILY WORK LOGS
  const sheet2 = workbook.addWorksheet('Daily Work Logs');

  sheet2.mergeCells('A1:F1');
  const titleCell2 = sheet2.getCell('A1');
  titleCell2.value = `DAILY WORK LOGS: ${team.name.toUpperCase()}`;
  titleCell2.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell2.fill = STYLES.headerFill;
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet2.getRow(1).height = 36;

  sheet2.addRow([]);

  const logHeaders = ['Log Date', 'Student Name', 'USN/Reg Number', 'Work Completed Task Description', 'Day Score (0-100)', 'Score Release Status'];
  const logHeaderRow = sheet2.addRow(logHeaders);
  logHeaderRow.height = 25;
  logHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  logHeaderRow.eachCell(c => {
    c.fill = STYLES.accentFill;
    c.border = STYLES.thinBorder;
  });

  if (!logs || logs.length === 0) {
    const emptyRow = sheet2.addRow(['—', '—', '—', '(No daily work logs submitted by this team yet)', '—', '—']);
    emptyRow.height = 24;
    emptyRow.eachCell(c => {
      c.border = STYLES.thinBorder;
      c.font = { italic: true, color: { argb: '94A3B8' } };
      c.alignment = { horizontal: 'center' };
    });
  } else {
    let rowCounter = 0;
    logs.forEach(logDay => {
      const logDate = logDay.date;
      const scoreVal = logDay.score !== null ? `${logDay.score}/100` : 'Not Graded';
      const releaseStatus = logDay.isScoreReleased ? 'RELEASED' : 'AWAITING RELEASE';

      (logDay.logs || []).forEach(mLog => {
        const row = sheet2.addRow([
          logDate,
          mLog.name,
          mLog.rollNumber,
          mLog.taskDone || '(No work logged)',
          scoreVal,
          releaseStatus
        ]);
        row.height = 20;
        row.eachCell((cell, colIdx) => {
          cell.border = STYLES.thinBorder;
          cell.fill = rowCounter % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;

          if (colIdx === 6) {
            if (logDay.isScoreReleased) {
              cell.fill = STYLES.statusFills.submitted;
              cell.font = STYLES.statusTexts.submitted;
            } else {
              cell.fill = STYLES.statusFills.problem_pending;
              cell.font = STYLES.statusTexts.problem_pending;
            }
          }
        });
        rowCounter++;
      });
    });
  }

  autoWidthColumns(sheet2);
  sheet2.getColumn(4).width = 45;

  await saveWorkbook(workbook, `team_${team.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
};

/**
 * 2. Export All Teams (summary list)
 */
export const exportAllTeamsExcel = async (teams, batchName = 'All Batches') => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Teams Summary');

  // Title Block
  sheet.mergeCells('A1:L1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `TEAMS DIRECTORY SUMMARY: ${batchName.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 36;

  sheet.addRow([]);

  // Table Headers
  const headers = [
    'Team Name',
    'Lead Name',
    'Lead USN/Reg',
    'Lead Email',
    'Lead Mobile',
    'Lead Dept',
    'Lead Division',
    'Room Number',
    'Course Name',
    'Total Size',
    'Status',
    'Allocated Problem Title'
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 26;
  headerRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell(cell => {
    cell.fill = STYLES.accentFill;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = STYLES.thinBorder;
  });

  // Rows
  teams.forEach((t, idx) => {
    const row = sheet.addRow([
      t.name,
      t.leadName || t.leadUsername,
      t.usnRollNumber || '—',
      t.email,
      t.mobile || '—',
      t.dept || '—',
      t.division || '—',
      t.roomNumber || '—',
      t.courseName || '—',
      (t.members?.length || 0) + 1,
      t.status.toUpperCase().replace('_', ' '),
      t.problemStatementId?.title || 'None Selected'
    ]);
    row.height = 20;

    row.eachCell((cell, colIdx) => {
      cell.border = STYLES.thinBorder;
      cell.fill = idx % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;

      // Highlight Status Cell
      if (colIdx === 11) {
        const rawStatus = t.status.toLowerCase();
        if (STYLES.statusFills[rawStatus]) {
          cell.fill = STYLES.statusFills[rawStatus];
          cell.font = { name: 'Segoe UI', size: 10, ...STYLES.statusTexts[rawStatus] };
          cell.alignment = { horizontal: 'center' };
        }
      }
    });
  });

  autoWidthColumns(sheet);
  await saveWorkbook(workbook, `all_teams_${batchName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
};

/**
 * 3. Export One Project (Master Workbook: Summary Sheet + Individual Sheet per Team)
 */
export const exportProjectExcel = async (project, teams, submissionsMap = {}, evaluationsMap = {}, logsByTeamMap = {}) => {
  const workbook = new ExcelJS.Workbook();

  // SHEET 1: BATCH DIRECTORY & DELIVERABLES SUMMARY
  const masterSheet = workbook.addWorksheet('Summary & Deliverables');

  masterSheet.mergeCells('A1:M1');
  const titleCell = masterSheet.getCell('A1');
  titleCell.value = `PROJECT MASTER REGISTER & DELIVERABLES: ${project.name.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  masterSheet.getRow(1).height = 40;

  masterSheet.addRow([]);

  const summaryHeaders = [
    'Team Name',
    'Team Lead Name',
    'Lead USN/Reg',
    'Lead Email',
    'Lead Mobile',
    'Training Room',
    'Department / Div',
    'Allocated Problem Statement Title',
    'Frontend (UI) GitHub Repo',
    'Backend (API) GitHub Repo',
    'Live Deployed App URL',
    'Evaluation Score (0-100)',
    'Current Status'
  ];

  const headerRow = masterSheet.addRow(summaryHeaders);
  headerRow.height = 28;
  headerRow.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell(c => {
    c.fill = STYLES.accentFill;
    c.alignment = { vertical: 'middle', horizontal: 'left' };
    c.border = STYLES.thinBorder;
  });

  teams.forEach((t, idx) => {
    const sub = submissionsMap[t._id] || {};
    const ev = evaluationsMap[t._id] || {};

    const row = masterSheet.addRow([
      t.name,
      t.leadName || t.leadUsername,
      t.usnRollNumber || '—',
      t.email,
      t.mobile || '—',
      t.roomNumber || '—',
      `${t.dept || '—'} ${t.division || ''}`.trim(),
      t.problemStatementId?.title || 'None Selected',
      sub.githubUrl || '— Not Submitted —',
      sub.backendGithubUrl || '— Not Submitted —',
      sub.deployedUrl || '— Not Deployed —',
      ev.score !== undefined && ev.score !== null ? `${ev.score}/100` : 'Not Evaluated',
      (t.status || 'problem_pending').toUpperCase().replace('_', ' ')
    ]);
    row.height = 22;

    row.eachCell((cell, colIdx) => {
      cell.border = STYLES.thinBorder;
      cell.fill = idx % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;

      if (colIdx === 13) {
        const rawStatus = (t.status || '').toLowerCase();
        if (STYLES.statusFills[rawStatus]) {
          cell.fill = STYLES.statusFills[rawStatus];
          cell.font = { name: 'Segoe UI', size: 10, ...STYLES.statusTexts[rawStatus] };
          cell.alignment = { horizontal: 'center' };
        }
      }
    });
  });

  autoWidthColumns(masterSheet);


  // INDIVIDUAL SHEETS: ONE SHEET PER TEAM (#01, #02, ..., #39)
  teams.forEach((t, tIdx) => {
    const sheetName = (t.name || `Team ${tIdx + 1}`).replace(/[*?:/\\\[\]]/g, '').substring(0, 30);
    const teamSheet = workbook.addWorksheet(sheetName);

    // Title
    teamSheet.mergeCells('A1:I1');
    const tTitle = teamSheet.getCell('A1');
    tTitle.value = `TEAM DOSSIER: ${t.name.toUpperCase()}`;
    tTitle.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    tTitle.fill = STYLES.headerFill;
    tTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    teamSheet.getRow(1).height = 36;

    // Metadata block
    teamSheet.addRow([]);
    teamSheet.addRow(['Account Username:', t.leadUsername, '', 'Status:', (t.status || 'N/A').toUpperCase()]);
    teamSheet.addRow(['Allocated Problem:', t.problemStatementId?.title || 'None Selected', '', 'Training Room:', t.roomNumber || '—']);
    teamSheet.addRow(['Contact Email:', t.email, '', 'Mobile Phone:', t.mobile || '—']);

    [3, 4, 5].forEach(rIdx => {
      teamSheet.getRow(rIdx).font = { name: 'Segoe UI', size: 10 };
      teamSheet.getCell(`A${rIdx}`).font = { bold: true, color: { argb: '1E3A8A' } };
      teamSheet.getCell(`D${rIdx}`).font = { bold: true, color: { argb: '1E3A8A' } };
    });

    // Deliverables Section
    const sub = submissionsMap[t._id] || {};
    teamSheet.addRow([]);
    teamSheet.addRow(['DELIVERABLE LINKS']);
    teamSheet.mergeCells('A7:I7');
    teamSheet.getCell('A7').font = { bold: true, size: 11, color: { argb: '1E3A8A' } };

    teamSheet.addRow(['Frontend (UI) GitHub:', sub.githubUrl || '— Not Submitted —']);
    teamSheet.addRow(['Backend (API) GitHub:', sub.backendGithubUrl || '— Not Submitted —']);
    teamSheet.addRow(['Live Deployment URL:', sub.deployedUrl || '— Not Deployed —']);
    [8, 9, 10].forEach(rIdx => {
      teamSheet.getCell(`A${rIdx}`).font = { bold: true };
    });

    teamSheet.addRow([]);

    // Roster Table
    teamSheet.addRow(['STUDENT ROSTER']);
    teamSheet.mergeCells('A12:I12');
    teamSheet.getCell('A12').font = { bold: true, size: 11, color: { argb: '1E3A8A' } };

    const rosterHeaders = ['Role', 'Student Name', 'USN / Reg Number', 'Email Address', 'Mobile Phone', 'Department', 'Division', 'Room Number', 'Course Name'];
    const rHeadRow = teamSheet.addRow(rosterHeaders);
    rHeadRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    rHeadRow.eachCell(c => {
      c.fill = STYLES.accentFill;
      c.border = STYLES.thinBorder;
    });

    // Lead row
    const leadR = teamSheet.addRow([
      'Team Lead',
      t.leadName || t.leadUsername,
      t.usnRollNumber || '—',
      t.email,
      t.mobile || '—',
      t.dept || '—',
      t.division || '—',
      t.roomNumber || '—',
      t.courseName || '—'
    ]);
    leadR.eachCell(c => {
      c.fill = STYLES.subheaderFill;
      c.font = { bold: true };
      c.border = STYLES.thinBorder;
    });

    // Members rows
    (t.members || []).forEach((m, mIdx) => {
      const mRow = teamSheet.addRow([
        'Member',
        m.name,
        m.rollNumber,
        m.email || '—',
        m.mobile || '—',
        m.dept || '—',
        m.division || '—',
        m.roomNumber || '—',
        m.courseName || '—'
      ]);
      mRow.eachCell(c => {
        c.fill = mIdx % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;
        c.border = STYLES.thinBorder;
      });
    });

    teamSheet.addRow([]);

    // Daily Logs Section inside Team Sheet
    teamSheet.addRow(['DAILY WORK LOGS']);
    const logHeaderRowIdx = teamSheet.lastRow.number;
    teamSheet.mergeCells(`A${logHeaderRowIdx}:I${logHeaderRowIdx}`);
    teamSheet.getCell(`A${logHeaderRowIdx}`).font = { bold: true, size: 11, color: { argb: '1E3A8A' } };

    const logHeaders = ['Log Date', 'Student Name', 'USN/Reg Number', 'Work Completed Task Description', 'Day Score', 'Status'];
    const logHeadRow = teamSheet.addRow(logHeaders);
    logHeadRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    logHeadRow.eachCell(c => {
      c.fill = STYLES.accentFill;
      c.border = STYLES.thinBorder;
    });

    const teamLogs = logsByTeamMap[t._id] || [];
    if (teamLogs.length === 0) {
      const emptyRow = teamSheet.addRow(['—', '—', '—', '(No daily work logs submitted by this team yet)', '—', '—']);
      emptyRow.eachCell(c => {
        c.border = STYLES.thinBorder;
        c.font = { italic: true, color: { argb: '94A3B8' } };
        c.alignment = { horizontal: 'center' };
      });
    } else {
      let rCnt = 0;
      teamLogs.forEach(logDay => {
        const logDate = logDay.date;
        const scoreVal = logDay.score !== null ? `${logDay.score}/100` : 'Not Graded';
        const releaseStatus = logDay.isScoreReleased ? 'RELEASED' : 'AWAITING RELEASE';

        (logDay.logs || []).forEach(mLog => {
          const row = teamSheet.addRow([
            logDate,
            mLog.name,
            mLog.rollNumber,
            mLog.taskDone || '(No work logged)',
            scoreVal,
            releaseStatus
          ]);
          row.eachCell((c) => {
            c.border = STYLES.thinBorder;
            c.fill = rCnt % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;
          });
          rCnt++;
        });
      });
    }

    autoWidthColumns(teamSheet);
    teamSheet.getColumn(4).width = 45;
  });

  await saveWorkbook(workbook, `capstone_project_${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_master_report.xlsx`);
};

/**
 * 4. Export One Problem Statement Allocation Report
 */
export const exportProblemExcel = async (problem, allocatedTeams) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Specification Details');

  // Title Block
  sheet.mergeCells('A1:E1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `PROJECT SPECIFICATION: ${problem.title.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 36;

  sheet.addRow([]);
  sheet.addRow(['Difficulty Level:', problem.difficulty.toUpperCase(), '', 'Course Subject:', problem.subjectId?.name || 'Global Pool']);
  sheet.addRow(['Tags:', (problem.tags || []).join(', ') || 'N/A', '', 'Allocated Teams:', `${allocatedTeams.length}/3 capacity limit`]);
  
  [3, 4].forEach(rIdx => {
    sheet.getCell(`A${rIdx}`).font = { bold: true };
    sheet.getCell(`D${rIdx}`).font = { bold: true };
  });

  sheet.addRow([]);

  // Block definitions
  sheet.addRow(['PROBLEM STATEMENT STATEMENT:']);
  sheet.addRow([problem.problemStatement]);
  sheet.mergeCells(`A7:E7`);
  sheet.getCell('A7').font = { italic: true, color: { argb: '475569' } };
  sheet.getRow(7).height = 38;

  sheet.addRow([]);

  sheet.addRow(['DETAILED REQUIREMENTS & SPECIFICATIONS:']);
  sheet.addRow([problem.description]);
  sheet.mergeCells(`A10:E11`);
  sheet.getCell('A10').alignment = { wrapText: true, vertical: 'top' };
  sheet.getRow(10).height = 80;

  sheet.addRow([]);
  sheet.addRow([]);

  // Expected Outputs
  sheet.addRow(['EXPECTED OUTCOME', 'DELIVERABLES']);
  const head = sheet.getRow(14);
  head.font = { bold: true, color: { argb: 'FFFFFF' } };
  head.eachCell(c => c.fill = STYLES.accentFill);
  sheet.addRow([problem.outcome, problem.expectedOutput]);
  sheet.getRow(15).eachCell(c => {
    c.border = STYLES.thinBorder;
    c.alignment = { wrapText: true };
  });
  sheet.getRow(15).height = 45;

  sheet.addRow([]);

  // Allocated Teams Table
  sheet.addRow(['LIST OF ALLOCATED TEAMS (Cap Limit: 3 Teams)']);
  sheet.mergeCells(`A18:E18`);
  sheet.getCell('A18').font = { bold: true, size: 11, color: { argb: '1E3A8A' } };

  const tableHeaders = ['Team Name', 'Team Lead Account', 'Lead Mobile', 'Department', 'Current Status'];
  const headerRow = sheet.addRow(tableHeaders);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell(c => {
    c.fill = STYLES.subheaderFill;
    c.font = { bold: true, color: { argb: '334155' } };
    c.border = STYLES.thinBorder;
  });

  allocatedTeams.forEach((t, i) => {
    const row = sheet.addRow([
      t.name,
      t.leadName || t.leadUsername,
      t.mobile || '—',
      t.dept || '—',
      t.status.toUpperCase()
    ]);
    row.eachCell((cell, colIdx) => {
      cell.border = STYLES.thinBorder;
      cell.fill = i % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;

      if (colIdx === 5) {
        const rawStatus = t.status.toLowerCase();
        if (STYLES.statusFills[rawStatus]) {
          cell.fill = STYLES.statusFills[rawStatus];
          cell.font = STYLES.statusTexts[rawStatus];
        }
      }
    });
  });

  autoWidthColumns(sheet);
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 25;
  await saveWorkbook(workbook, `problem_allocation_${problem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
};

/**
 * 5. Export All Problem Statements Pool
 */
export const exportAllProblemsExcel = async (problems) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Problems Pool');

  // Title Block
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `CAPSTONE PROBLEMS STATEMENT REGISTER`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 36;

  sheet.addRow([]);

  const headers = [
    'Project Title',
    'Difficulty',
    'Subject Group',
    'Statement Description Summary',
    'Expected Deliverable Output',
    'Learning Outcomes',
    'Suggested Technology Stack'
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 25;
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell(c => {
    c.fill = STYLES.accentFill;
    c.border = STYLES.thinBorder;
  });

  problems.forEach((p, idx) => {
    const row = sheet.addRow([
      p.title,
      p.difficulty.toUpperCase(),
      p.subjectId?.name || 'Global Pool',
      p.problemStatement,
      p.expectedOutput,
      p.outcome,
      (p.suggestedTech || []).join(', ') || 'N/A'
    ]);
    row.height = 22;
    row.eachCell(c => {
      c.border = STYLES.thinBorder;
      c.fill = idx % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;
    });
  });

  autoWidthColumns(sheet);
  await saveWorkbook(workbook, `all_capstone_problems_pool.xlsx`);
};

/**
 * 6. Export One Team's Daily Work Logs (Date-wise Sheets)
 */
export const exportTeamLogsExcel = async (teamName, logs) => {
  const workbook = new ExcelJS.Workbook();

  if (!logs || logs.length === 0) {
    const sheet = workbook.addWorksheet('No Logs');
    sheet.addRow(['No daily work logs submitted by this team yet.']).font = { italic: true };
  } else {
    // Group logs by date
    const logsByDate = {};
    logs.forEach(logDay => {
      if (!logsByDate[logDay.date]) logsByDate[logDay.date] = [];
      logsByDate[logDay.date].push(logDay);
    });

    // Create a sheet for each unique date
    Object.keys(logsByDate).sort().forEach(date => {
      // Excel tab name character clean-up
      const finalTabName = date.replace(/[:\\/?*\[\]]/g, '').substring(0, 31);
      const sheet = workbook.addWorksheet(finalTabName);

      // Title Block
      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `DAILY WORK LOGS: ${teamName.toUpperCase()} — ${date}`;
      titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = STYLES.headerFill;
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 36;

      sheet.addRow([]);

      // Headers (removed Date column since it's the sheet name)
      const headers = ['Student Name', 'USN/Reg Number', 'Work Completed Task Description', 'Day Score (0-100)', 'Score Release Status'];
      const headerRow = sheet.addRow(headers);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell(c => {
        c.fill = STYLES.accentFill;
        c.border = STYLES.thinBorder;
      });

      let rowCounter = 0;
      logsByDate[date].forEach(logDay => {
        const scoreVal = logDay.score !== null ? `${logDay.score}/100` : 'Not Graded';
        const releaseStatus = logDay.isScoreReleased ? 'RELEASED' : 'AWAITING RELEASE';

        logDay.logs.forEach(mLog => {
          const row = sheet.addRow([
            mLog.name,
            mLog.rollNumber,
            mLog.taskDone || '(No work logged)',
            scoreVal,
            releaseStatus
          ]);
          row.height = 20;
          row.eachCell((cell, colIdx) => {
            cell.border = STYLES.thinBorder;
            cell.fill = rowCounter % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;

            if (colIdx === 5) {
              if (logDay.isScoreReleased) {
                cell.fill = STYLES.statusFills.submitted;
                cell.font = STYLES.statusTexts.submitted;
              } else {
                cell.fill = STYLES.statusFills.problem_pending;
                cell.font = STYLES.statusTexts.problem_pending;
              }
            }
          });
          rowCounter++;
        });
      });

      autoWidthColumns(sheet);
      sheet.getColumn(3).width = 45;
    });
  }

  await saveWorkbook(workbook, `daily_logs_${teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
};

/**
 * 7. Export All Daily Work Logs (All Teams, Date-wise Sheets)
 */
export const exportAllLogsExcel = async (allLogs) => {
  const workbook = new ExcelJS.Workbook();

  if (!allLogs || allLogs.length === 0) {
    const sheet = workbook.addWorksheet('No Logs');
    sheet.addRow(['No daily work logs found.']).font = { italic: true };
  } else {
    // Group logs by date
    const logsByDate = {};
    allLogs.forEach(logDay => {
      if (!logsByDate[logDay.date]) logsByDate[logDay.date] = [];
      logsByDate[logDay.date].push(logDay);
    });

    // Create a sheet for each unique date
    Object.keys(logsByDate).sort().forEach(date => {
      // Excel tab name character clean-up
      const finalTabName = date.replace(/[:\\/?*\[\]]/g, '').substring(0, 31);
      const sheet = workbook.addWorksheet(finalTabName);

      // Title Block
      sheet.mergeCells('A1:F1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `MASTER DAILY WORK LOGS: ${date}`;
      titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = STYLES.headerFill;
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 36;

      sheet.addRow([]);

      // Headers (removed Date column since it's the sheet name)
      const headers = ['Team Name', 'Student Name', 'USN/Reg Number', 'Work Completed Task Description', 'Day Score (0-100)', 'Release Status'];
      const headerRow = sheet.addRow(headers);
      headerRow.height = 25;
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell(c => {
        c.fill = STYLES.accentFill;
        c.border = STYLES.thinBorder;
      });

      let rowCounter = 0;
      logsByDate[date].forEach(logDay => {
        const teamName = logDay.teamId?.name || 'Deleted Team';
        const scoreVal = logDay.score !== null ? `${logDay.score}/100` : 'Not Graded';
        const releaseStatus = logDay.isScoreReleased ? 'RELEASED' : 'AWAITING RELEASE';

        logDay.logs.forEach(mLog => {
          const row = sheet.addRow([
            teamName,
            mLog.name,
            mLog.rollNumber,
            mLog.taskDone || '(No work logged)',
            scoreVal,
            releaseStatus
          ]);
          row.height = 20;
          row.eachCell((cell, colIdx) => {
            cell.border = STYLES.thinBorder;
            cell.fill = rowCounter % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;

            if (colIdx === 6) {
              if (logDay.isScoreReleased) {
                cell.fill = STYLES.statusFills.submitted;
                cell.font = STYLES.statusTexts.submitted;
              } else {
                cell.fill = STYLES.statusFills.problem_pending;
                cell.font = STYLES.statusTexts.problem_pending;
              }
            }
          });
          rowCounter++;
        });
      });

      autoWidthColumns(sheet);
      sheet.getColumn(4).width = 45;
    });
  }

  await saveWorkbook(workbook, `all_teams_master_daily_logs_report.xlsx`);
};
