let cachedData = [];
let currentFilter = 'all'; // Tracks active filter: 'all', 'latex', or 'non-latex'
let flaggedIds = new Set(); // Tracks duplicate IDs for row highlighting

document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();

  document.getElementById('refreshBtn')?.addEventListener('click', fetchDashboardData);
  document.getElementById('exportCsvBtn')?.addEventListener('click', exportToCSV);
});

async function fetchDashboardData() {
  const tableBody = document.getElementById('responseTableBody');
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="100" style="text-align: center; color: var(--text-muted);">Loading all survey responses...</td></tr>';
  }

  try {
    const response = await fetch('http://localhost:3000/api/responses');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    cachedData = data || [];
    
    // Compute duplicates and cache their IDs
    const duplicates = detectPotentialDuplicates(cachedData);
    flaggedIds.clear();
    duplicates.forEach(d => {
      flaggedIds.add(d.idA);
      flaggedIds.add(d.idB);
    });

    renderMetrics(cachedData, duplicates);
    applyFilterAndRender();
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="100" style="text-align: center; color: var(--error-color);">Failed to load data. Make sure your local server is running.</td></tr>`;
    }
  }
}

function setCardFilter(filterType) {
  // If the user clicks the already active filter card, toggle it back to 'all' (remove filter)
  if (currentFilter === filterType) {
    currentFilter = 'all';
  } else {
    currentFilter = filterType;
  }

  updateCardVisuals();
  applyFilterAndRender();
}

function updateCardVisuals() {
  const cardTotal = document.getElementById('cardTotal');
  const cardLatex = document.getElementById('cardLatex');
  const cardNonLatex = document.getElementById('cardNonLatex');

  // Reset all cards to standard border
  [cardTotal, cardLatex, cardNonLatex].forEach(card => {
    if (card) {
      card.style.border = '1px solid #e2e8f0';
      card.style.boxShadow = 'var(--shadow-sm)';
      card.style.transform = 'translateY(0)';
    }
  });

  // Highlight the active card
  let activeCard = null;
  if (currentFilter === 'all') activeCard = cardTotal;
  if (currentFilter === 'latex') activeCard = cardLatex;
  if (currentFilter === 'non-latex') activeCard = cardNonLatex;

  if (activeCard) {
    activeCard.style.border = '2px solid var(--primary)';
    activeCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    activeCard.style.transform = 'translateY(-2px)';
  }
}

function applyFilterAndRender() {
  let filteredData = cachedData;

  if (currentFilter === 'latex') {
    filteredData = cachedData.filter(d => d.used_latex_before === 'Yes');
  } else if (currentFilter === 'non-latex') {
    filteredData = cachedData.filter(d => d.used_latex_before === 'No');
  }

  renderTable(filteredData);
}

function renderMetrics(data, duplicates) {
  const total = data.length;
  const latexUsers = data.filter(d => d.used_latex_before === 'Yes').length;
  const nonLatexUsers = data.filter(d => d.used_latex_before === 'No').length;

  const totalEl = document.getElementById('totalResponses');
  const latexEl = document.getElementById('latexUsersCount');
  const nonLatexEl = document.getElementById('nonLatexUsersCount');

  if (totalEl) totalEl.textContent = total;
  if (latexEl) latexEl.textContent = latexUsers;
  if (nonLatexEl) nonLatexEl.textContent = nonLatexUsers;

  const alertCard = document.getElementById('duplicateAlertCard');
  const duplicateList = document.getElementById('duplicateList');

  if (duplicates.length > 0 && alertCard && duplicateList) {
    alertCard.style.display = 'block';
    duplicateList.innerHTML = duplicates.map(dup => 
      `<li>Entries <strong>#${dup.idA}</strong> and <strong>#${dup.idB}</strong> — <span style="color: #b45309; font-weight: 600;">${dup.reason}</span> from school: <em>${dup.school}</em></li>`
    ).join('');
  } else if (alertCard) {
    alertCard.style.display = 'none';
  }
}

function renderTable(data) {
  const tableHead = document.querySelector('thead') || document.querySelector('#responseTableHead');
  const tableBody = document.getElementById('responseTableBody');
  
  if (!tableBody) return;

  // --- CUSTOM COLUMN ORDER DEFINITION ---
  const displayOrder = [
  // Metadata / Demographics (Part I)
  'id',
  'created_at',
  'respondent_name',
  'school_name',
  'school_sector',
  'municipality',
  'gender',
  'age',
  'subjects_taught',
  'other_subjects_details',
  'years_teaching_math',
  'produced_im_team',
  'years_im_experience',
  'highest_education',
  'internet_access',
  'used_latex_before',
  'latex_duration',
  'latex_school_status',
  'primary_im_method',
  'primary_im_method_other',

  // Q16: Difficulty Matrix Items (Part I continued)
  'diff_16a',
  'diff_16b',
  'diff_16c',
  'diff_16d',
  'diff_16e',
  'diff_16f',
  'diff_16g',
  'diff_16h',
  'diff_16i',
  'diff_16j',
  'diff_16k',
  'diff_16l_other',

  // Part II: UTAUT Constructs
  // Performance Expectancy (PE)
  'pe1', 'pe2', 'pe3', 'pe4',
  // Effort Expectancy (EE)
  'ee1', 'ee2', 'ee3', 'ee4',
  // Social Influence (SI)
  'si1', 'si2', 'si3',
  // Facilitating Conditions (FC)
  'fc1', 'fc2', 'fc3',
  // Behavioral Intention (BI)
  'bi1', 'bi2', 'bi3',
  // Use Behavior (UB)
  'ub1', 'ub2',

  // Part III: Feedback
  'feedback_reason',
  'feedback_barrier'
];

  if (tableHead) {
    tableHead.innerHTML = `
      <tr>
        <th style="position: sticky; left: 0; background: #fff; z-index: 2; border-right: 2px solid #e2e8f0;">Actions</th>
        ${displayOrder.map(h => `<th>${h.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
      </tr>
    `;
  }

  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${displayOrder.length + 1}" style="text-align: center; color: var(--text-muted);">No matching submissions found for this filter.</td></tr>`;
    return;
  }

  tableBody.innerHTML = data.map(row => {
    const isDuplicate = flaggedIds.has(row.id);
    const rowBgStyle = isDuplicate ? 'background-color: #fef3c7; border-left: 4px solid #f59e0b;' : '';

    return `
      <tr style="${rowBgStyle}">
        <td style="position: sticky; left: 0; background: ${isDuplicate ? '#fef3c7' : '#fff'}; z-index: 1; border-right: 2px solid #e2e8f0; text-align: center;">
          <button onclick="deleteResponse(${row.id})" style="background-color: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
          ${isDuplicate ? '<span title="Potential Duplicate" style="margin-left: 4px;">⚠️</span>' : ''}
        </td>
        ${displayOrder.map(h => {
          let val = row[h];
          if (h === 'created_at' && val) {
            val = new Date(val).toLocaleString();
          }
          return `<td>${val !== null && val !== undefined ? val : 'N/A'}</td>`;
        }).join('')}
      </tr>
    `;
  }).join('');
}

async function deleteResponse(id) {
  const confirmed = confirm("Are you sure you want to delete this response? This action cannot be undone.");
  if (!confirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/responses/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete response from server');
    }

    const result = await response.json();
    if (result.success) {
      fetchDashboardData();
    } else {
      alert('Could not delete the response.');
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error connecting to server while trying to delete.');
  }
}

function exportToCSV() {
  if (!cachedData || cachedData.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = [
    'id', 'created_at', 'respondent_name', 'school_name', 'municipality', 'gender', 'age', 
    'subjects_taught', 'years_teaching_math', 'used_latex_before', 'latex_duration', 
    'primary_im_method', 'pe1', 'pe2', 'pe3', 'pe4', 'ee1', 'ee2', 'ee3', 'ee4', 
    'si1', 'si2', 'si3', 'fc1', 'fc2', 'fc3', 'bi1', 'bi2', 'bi3', 'feedback_reason'
  ];

  const csvRows = [headers.join(',')];

  cachedData.forEach(row => {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `survey_responses_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function compareValues(val1, val2) {
  if (!val1 || !val2) return 0;
  return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase() ? 1 : 0;
}

function detectPotentialDuplicates(data) {
  const flags = [];

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      let entryA = data[i];
      let entryB = data[j];

      let matchScore = 0;
      let totalFieldsChecked = 0;

      let sameDevice = entryA.visitor_id && entryB.visitor_id && (entryA.visitor_id === entryB.visitor_id);

      const demographicFields = ['school_name', 'municipality', 'age', 'gender', 'years_teaching_math', 'highest_education'];
      
      demographicFields.forEach(field => {
        if (entryA[field] !== undefined && entryB[field] !== undefined) {
          totalFieldsChecked++;
          matchScore += compareValues(entryA[field], entryB[field]);
        }
      });

      const demographicMatchPercentage = totalFieldsChecked > 0 ? (matchScore / totalFieldsChecked) * 100 : 0;

      if (sameDevice || demographicMatchPercentage >= 70) {
        let reasons = [];
        if (sameDevice) reasons.push('Same Device Identifier');
        if (demographicMatchPercentage >= 70) reasons.push(`${Math.round(demographicMatchPercentage)}% Demographic Match`);

        flags.push({
          idA: entryA.id,
          idB: entryB.id,
          reason: reasons.join(' + '),
          school: entryA.school_name || 'N/A'
        });
      }
    }
  }
  return flags;
}