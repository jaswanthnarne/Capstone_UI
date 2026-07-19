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
 * 1. Export One Team
 */
export const exportTeamExcel = async (team) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Team Details');

  // Title Block
  sheet.mergeCells('A1:I1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `TEAM REPORT: ${team.name.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 40;

  // Metadata block
  sheet.addRow([]);
  sheet.addRow(['Batch Name:', team.batchId?.name || 'N/A', '', 'Status:', team.status || 'N/A']);
  sheet.addRow(['College:', team.collegeId?.name || 'N/A', '', 'Project Allocated:', team.problemStatementId?.title || 'None Selected']);
  sheet.addRow(['Email Account:', team.email, '', 'Change Count:', `${team.problemChangeCount || 0}/3 attempts`]);
  
  // Format metadata
  [3, 4, 5].forEach(rowIdx => {
    sheet.getRow(rowIdx).font = { name: 'Segoe UI', size: 10 };
    sheet.getCell(`A${rowIdx}`).font = { bold: true, color: { argb: '475569' } };
    sheet.getCell(`D${rowIdx}`).font = { bold: true, color: { argb: '475569' } };
  });

  sheet.addRow([]);

  // Table Headers
  const tableHeaders = ['Role', 'Student Name', 'USN / Reg Number', 'Email Address', 'Mobile Number', 'Department', 'Division', 'Room Number', 'Course Name'];
  const headerRow = sheet.addRow(tableHeaders);
  headerRow.height = 25;
  headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell((cell, i) => {
    cell.fill = STYLES.accentFill;
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  // Team Lead Data Row
  const leadRow = sheet.addRow([
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
    const row = sheet.addRow([
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

  autoWidthColumns(sheet);
  await saveWorkbook(workbook, `${team.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
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
 * 3. Export One Project (Full Batch details with Multi-Sheets)
 */
export const exportProjectExcel = async (project, teams) => {
  const workbook = new ExcelJS.Workbook();

  // SHEET 1: OVERVIEW & STATS
  const overviewSheet = workbook.addWorksheet('Project Overview');
  
  overviewSheet.mergeCells('A1:D1');
  const titleCell = overviewSheet.getCell('A1');
  titleCell.value = `PROJECT DASHBOARD: ${project.name.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  overviewSheet.getRow(1).height = 36;

  overviewSheet.addRow([]);
  overviewSheet.addRow(['Capstone Project Name:', project.name]);
  overviewSheet.addRow(['Subject Area:', project.subjectId?.name || 'Global Pool']);
  overviewSheet.addRow(['Selection Limit Rule:', '3 selection changes allowed per team']);
  overviewSheet.addRow(['Lock Selection Status:', project.isProblemSelectionLocked ? 'LOCKED BY ADMIN' : 'UNLOCKED (Open to students)']);
  
  // Format summary labels
  [3, 4, 5, 6].forEach(rIdx => {
    overviewSheet.getCell(`A${rIdx}`).font = { bold: true, color: { argb: '1E3A8A' } };
  });

  // Calculate Metrics
  const totalTeams = teams.length;
  const submittedTeams = teams.filter(t => t.status === 'submitted').length;
  const inProgressTeams = teams.filter(t => t.status === 'in_progress').length;
  const pendingTeams = teams.filter(t => t.status === 'problem_pending').length;

  overviewSheet.addRow([]);
  overviewSheet.addRow(['METRIC CARD', 'VALUE', 'REMARKS']);
  const headRow = overviewSheet.getRow(8);
  headRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headRow.eachCell(c => c.fill = STYLES.accentFill);

  overviewSheet.addRow(['Total Registered Teams', totalTeams, 'All created accounts']);
  overviewSheet.addRow(['Final Submissions Done', submittedTeams, 'Completed evaluations']);
  overviewSheet.addRow(['Teams In Progress', inProgressTeams, 'Allocated & Working']);
  overviewSheet.addRow(['Pending Team Allocations', pendingTeams, 'Problem not selected yet']);

  [9, 10, 11, 12].forEach(rIdx => {
    overviewSheet.getRow(rIdx).eachCell(c => c.border = STYLES.thinBorder);
    overviewSheet.getCell(`B${rIdx}`).font = { bold: true };
  });

  autoWidthColumns(overviewSheet);


  // SHEET 2: ALLOCATIONS LIST
  const allocationsSheet = workbook.addWorksheet('Team Allocations');
  allocationsSheet.addRow(['Team Name', 'Team Lead', 'Selected Project Title', 'Remaining Changes', 'Work Status']);
  const allocHeader = allocationsSheet.getRow(1);
  allocHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  allocHeader.eachCell(c => {
    c.fill = STYLES.headerFill;
    c.border = STYLES.thinBorder;
  });

  teams.forEach((t, i) => {
    const row = allocationsSheet.addRow([
      t.name,
      t.leadName || t.leadUsername,
      t.problemStatementId?.title || '— None selected —',
      `${3 - (t.problemChangeCount || 0)} left`,
      t.status.toUpperCase().replace('_', ' ')
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

  autoWidthColumns(allocationsSheet);


  // SHEET 3: MASTER ROSTER (ALL INDIVIDUAL STUDENTS)
  const rosterSheet = workbook.addWorksheet('Master Roster');
  
  const rosterHeaders = [
    'Student Name',
    'Role',
    'USN / Roll Number',
    'Email Address',
    'Mobile Phone',
    'Department',
    'Division',
    'Room Number',
    'Course Name',
    'Belongs to Team'
  ];

  const rosterHeaderRow = rosterSheet.addRow(rosterHeaders);
  rosterHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  rosterHeaderRow.eachCell(c => {
    c.fill = STYLES.accentFill;
    c.border = STYLES.thinBorder;
  });

  let rowCounter = 0;
  teams.forEach(t => {
    // Add Team Lead
    const leadRow = rosterSheet.addRow([
      t.leadName || t.leadUsername,
      'Team Lead',
      t.usnRollNumber || '—',
      t.email,
      t.mobile || '—',
      t.dept || '—',
      t.division || '—',
      t.roomNumber || '—',
      t.courseName || '—',
      t.name
    ]);
    leadRow.eachCell(c => {
      c.fill = STYLES.subheaderFill;
      c.font = { bold: true };
      c.border = STYLES.thinBorder;
    });

    // Add Members
    (t.members || []).forEach(m => {
      const memberRow = rosterSheet.addRow([
        m.name,
        'Member',
        m.rollNumber,
        m.email || '—',
        m.mobile || '—',
        m.dept || '—',
        m.division || '—',
        m.roomNumber || '—',
        m.courseName || '—',
        t.name
      ]);
      memberRow.eachCell(c => {
        c.fill = rowCounter % 2 === 0 ? STYLES.zebraFill : STYLES.whiteFill;
        c.border = STYLES.thinBorder;
      });
      rowCounter++;
    });
  });

  autoWidthColumns(rosterSheet);

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
 * 6. Export One Team's Daily Work Logs
 */
export const exportTeamLogsExcel = async (teamName, logs) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Daily Logs');

  // Title Block
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `DAILY WORK LOGS: ${teamName.toUpperCase()}`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 36;

  sheet.addRow([]);

  // Headers
  const headers = ['Log Date', 'Student Name', 'USN/Reg Number', 'Work Completed Task Description', 'Day Score (0-100)', 'Score Release Status'];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 25;
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell(c => {
    c.fill = STYLES.accentFill;
    c.border = STYLES.thinBorder;
  });

  let rowCounter = 0;
  logs.forEach(logDay => {
    const logDate = logDay.date;
    const scoreVal = logDay.score !== null ? `${logDay.score}/100` : 'Not Graded';
    const releaseStatus = logDay.isScoreReleased ? 'RELEASED' : 'AWAITING RELEASE';

    logDay.logs.forEach(mLog => {
      const row = sheet.addRow([
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

  autoWidthColumns(sheet);
  sheet.getColumn(4).width = 40;
  await saveWorkbook(workbook, `daily_logs_${teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
};

/**
 * 7. Export All Daily Work Logs (All Teams)
 */
export const exportAllLogsExcel = async (allLogs) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('All Work Logs');

  // Title Block
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `MASTER REGISTER: ALL TEAM DAILY WORK LOGS`;
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = STYLES.headerFill;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 36;

  sheet.addRow([]);

  // Headers
  const headers = ['Team Name', 'Log Date', 'Student Name', 'USN/Reg Number', 'Work Completed Task Description', 'Day Score (0-100)', 'Release Status'];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 25;
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell(c => {
    c.fill = STYLES.accentFill;
    c.border = STYLES.thinBorder;
  });

  let rowCounter = 0;
  allLogs.forEach(logDay => {
    const teamName = logDay.teamId?.name || 'Deleted Team';
    const logDate = logDay.date;
    const scoreVal = logDay.score !== null ? `${logDay.score}/100` : 'Not Graded';
    const releaseStatus = logDay.isScoreReleased ? 'RELEASED' : 'AWAITING RELEASE';

    logDay.logs.forEach(mLog => {
      const row = sheet.addRow([
        teamName,
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

        if (colIdx === 7) {
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
  sheet.getColumn(5).width = 45;
  await saveWorkbook(workbook, `all_teams_master_daily_logs_report.xlsx`);
};
