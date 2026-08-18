const STEP_BACKGROUNDS = {
  1: '#f8fafc',
  2: '#f1f5f9',
  3: '#f0fdf4',
  4: '#f5f3ff',
  5: '#fffbeb',
  6: '#ecfdf5'
};

const STEP_LABELS = {
  1: 'Step 1 of 5: Consent',
  2: 'Step 2 of 5: Background Info',
  3: 'Step 3 of 5: Technical Overview',
  4: 'Step 4 of 5: Core Survey Items',
  5: 'Step 5 of 5: Feedback',
  6: 'Survey Completed'
};

// GLOBAL goToStep function so navigation works cleanly everywhere
function goToStep(stepNumber) {
  document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
  
  const targetStep = document.getElementById(`step${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
  }

  if (STEP_BACKGROUNDS[stepNumber]) {
    document.body.style.backgroundColor = STEP_BACKGROUNDS[stepNumber];
  }

  const counterEl = document.getElementById('stepCounterText');
  if (counterEl && STEP_LABELS[stepNumber]) {
    counterEl.textContent = STEP_LABELS[stepNumber];
  }

  // Trigger MathJax re-render on entering Step 3
  if (stepNumber === 3 && window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([document.getElementById('step3')]).catch(err => console.log(err));
  }

  if (stepNumber === 4 && typeof window.updatePart2Guidance === 'function') {
    window.updatePart2Guidance();
  }

  const progressPercent = Math.min((stepNumber / 5) * 100, 100);
  const progressBar = document.getElementById('progressBar');
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {

  const SHARE_MESSAGE = `Greetings! 

If you are a High School Mathematics Teacher in Catanduanes, I kindly invite you to participate in a short research survey entitled:

"EXPLORING THE ADOPTION OF LaTeX AMONG HIGH SCHOOL MATHEMATICS TEACHERS IN CATANDUANES"

Whether you are a regular LaTeX user, have tried it before, or have NEVER used it, your input is valuable!

⏱️ Time required: 10-15 minutes
🔗 Link to survey: ${window.location.href}

Thank you for supporting graduate school research in our division!`;

  const surveyForm = document.getElementById('surveyForm');

  const stepButtonMap = {
    1: 'step1Btn',
    2: 'goToStep3',
    3: 'goToStep4',
    4: 'goToStep5',
    5: 'submitBtn'
  };

  function updatePart2Guidance() {
    const guidanceEl = document.getElementById('utautGuidanceText');
    if (!guidanceEl) return;

    const usedLatex = document.querySelector('input[name="usedLatex"]:checked')?.value;

    if (usedLatex === 'Yes') {
      guidanceEl.innerHTML = 'As a <strong>current/past LaTeX user</strong>, please answer the following statements based on your <em>actual experience</em> using LaTeX.';
    } else if (usedLatex === 'No') {
      guidanceEl.innerHTML = 'As someone who has <strong>not used LaTeX before</strong>, please answer the following statements based on your <em>perceptions, expectations, or impressions</em> of LaTeX from the technical overview provided.';
    } else {
      guidanceEl.innerHTML = '<strong>Current LaTeX Users:</strong> Please answer based on your <em>actual experience</em>.<br><strong>Non-LaTeX Users:</strong> Please answer based on your <em>perception and expectation</em>.';
    }
  }

  window.updatePart2Guidance = updatePart2Guidance;

  function getUnansweredRequiredFields(stepNumber) {
    const stepEl = document.getElementById(`step${stepNumber}`);
    if (!stepEl) return [];

    const requiredInputs = stepEl.querySelectorAll('[required]');
    const missingElements = [];
    const checkedRadioGroups = new Set();

    requiredInputs.forEach(input => {
      if (input.closest('.d-none')) return;

      if (input.type === 'radio') {
        if (!checkedRadioGroups.has(input.name)) {
          const isChecked = stepEl.querySelector(`input[name="${input.name}"]:checked`);
          if (!isChecked) {
            const container = input.closest('.q-card') || input.closest('.form-group') || input.parentElement;
            missingElements.push(container);
            checkedRadioGroups.add(input.name);
          }
        }
      } else if (input.type === 'checkbox') {
        if (!input.checked) {
          const container = input.closest('.q-card') || input.parentElement;
          missingElements.push(container);
        }
      } else {
        if (!input.value.trim()) {
          missingElements.push(input);
        }
      }
    });

    return missingElements;
  }

  function checkStepValidity(stepNumber) {
    const btnEl = document.getElementById(stepButtonMap[stepNumber]);
    if (!btnEl) return true;

    const missing = getUnansweredRequiredFields(stepNumber);
    if (missing.length > 0) {
      btnEl.classList.add('btn-inactive');
      return false;
    } else {
      btnEl.classList.remove('btn-inactive');
      return true;
    }
  }

  function highlightMissingFields(missingElements) {
    missingElements.forEach(el => {
      el.classList.remove('field-highlight-missing');
      void el.offsetWidth; // Trigger reflow to restart animation
      el.classList.add('field-highlight-missing');

      // Automatically remove the red highlight after 2.5 seconds
      setTimeout(() => {
        el.classList.remove('field-highlight-missing');
      }, 2500);
    });
  }

  function handleStepTransition(currentStep, targetStep) {
    const missing = getUnansweredRequiredFields(currentStep);

    if (missing.length > 0) {
      highlightMissingFields(missing);
      const firstMissing = missing[0];
      firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      goToStep(targetStep);
    }
  }

  if (surveyForm) {
    ['input', 'change'].forEach(eventType => {
      surveyForm.addEventListener(eventType, () => {
        const activeStep = document.querySelector('.wizard-step.active');
        if (activeStep) {
          const stepNum = parseInt(activeStep.id.replace('step', ''), 10);
          checkStepValidity(stepNum);
        }
      });
    });
  }

  // WIZARD NAVIGATION HANDLERS
  document.getElementById('step1Btn')?.addEventListener('click', () => {
    const consentCheck = document.getElementById('consentCheck');
    const card = consentCheck?.closest('.q-card') || consentCheck?.parentElement;

    if (consentCheck && !consentCheck.checked) {
      alert('Please check the informed consent box to confirm your participation before proceeding.');
      if (card) {
        card.classList.add('field-highlight-missing');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (card) card.classList.remove('field-highlight-missing');
    goToStep(2);
  });

  document.getElementById('backToStep1')?.addEventListener('click', () => goToStep(1));
  document.getElementById('goToStep3')?.addEventListener('click', () => handleStepTransition(2, 3));

  document.getElementById('backToStep2')?.addEventListener('click', () => goToStep(2));
  document.getElementById('goToStep4')?.addEventListener('click', () => goToStep(4));

  document.getElementById('backToStep3')?.addEventListener('click', () => goToStep(3));
  document.getElementById('goToStep5')?.addEventListener('click', () => handleStepTransition(4, 5));

  document.getElementById('backToStep4')?.addEventListener('click', () => goToStep(4));

  document.getElementById('submitBtn')?.addEventListener('click', () => {
    const missing = getUnansweredRequiredFields(5);
    if (missing.length > 0) {
      highlightMissingFields(missing);
      missing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      submitSurvey();
    }
  });

  // Dynamic Toggles
  const subjMathOther = document.getElementById('subjMathOther');
  const subjMathOnly = document.getElementById('subjMathOnly');
  const otherSubjectsContainer = document.getElementById('otherSubjectsContainer');
  const otherSubjectsDetails = document.getElementById('otherSubjectsDetails');

  subjMathOther?.addEventListener('change', () => {
    otherSubjectsContainer?.classList.remove('d-none');
    if (otherSubjectsDetails) otherSubjectsDetails.required = true;
    checkStepValidity(2);
  });

  subjMathOnly?.addEventListener('change', () => {
    otherSubjectsContainer?.classList.add('d-none');
    if (otherSubjectsDetails) {
      otherSubjectsDetails.required = false;
      otherSubjectsDetails.value = '';
    }
    checkStepValidity(2);
  });

  const usedLatexRadios = document.querySelectorAll('input[name="usedLatex"]');
  const q13Container = document.getElementById('q13Container');
  const sectionUB = document.getElementById('sectionUB');

  usedLatexRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isYes = e.target.value === 'Yes';
      
      if (isYes) {
        q13Container?.classList.remove('d-none');
        document.querySelectorAll('input[name="latexDuration"]').forEach(el => el.required = true);
        
        sectionUB?.classList.remove('d-none');
        document.querySelectorAll('input[name^="ub"]').forEach(el => el.required = true);
      } else {
        q13Container?.classList.add('d-none');
        document.querySelectorAll('input[name="latexDuration"]').forEach(el => {
          el.required = false;
          el.checked = false;
        });

        sectionUB?.classList.add('d-none');
        document.querySelectorAll('input[name^="ub"]').forEach(el => {
          el.required = false;
          el.checked = false;
        });
      }

      updatePart2Guidance();
      checkStepValidity(2);
    });
  });

  const primaryMethodRadios = document.querySelectorAll('input[name="primaryIMMethod"]');
  const primaryIMOtherContainer = document.getElementById('primaryIMOtherContainer');
  const primaryIMMethodOtherDetails = document.getElementById('primaryIMMethodOtherDetails');

  primaryMethodRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.id === 'primaryIMMethodOtherRadio') {
        primaryIMOtherContainer?.classList.remove('d-none');
        if (primaryIMMethodOtherDetails) primaryIMMethodOtherDetails.required = true;
      } else {
        primaryIMOtherContainer?.classList.add('d-none');
        if (primaryIMMethodOtherDetails) {
          primaryIMMethodOtherDetails.required = false;
          primaryIMMethodOtherDetails.value = '';
        }
      }
      checkStepValidity(2);
    });
  });

  document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      const targetId = e.target.getAttribute('data-info');
      const box = document.getElementById(targetId);

      if (box) {
        if (box.style.display === 'block') {
          box.style.display = 'none';
        } else {
          document.querySelectorAll('.clarification-box').forEach(el => el.style.display = 'none');
          box.style.display = 'block';
        }
      }
    });
  });

  async function submitSurvey() {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    const payload = {
      respondent_name: document.getElementById('respondentName')?.value || null,
      school_name: document.getElementById('school_name')?.value || '',
      school_sector: document.querySelector('input[name="schoolSector"]:checked')?.value || '',
      gender: document.querySelector('input[name="gender"]:checked')?.value || '',
      age: parseInt(document.getElementById('age')?.value, 10) || null,
      municipality: document.getElementById('municipality')?.value || '',
      subjects_taught: document.querySelector('input[name="subjectsTaught"]:checked')?.value || '',
      other_subjects_details: document.getElementById('otherSubjectsDetails')?.value || null,
      years_teaching_math: parseFloat(document.getElementById('yearsTeachingMath')?.value) || null,
      produced_im_team: document.querySelector('input[name="producedIMTeam"]:checked')?.value || '',
      years_im_experience: parseFloat(document.getElementById('yearsIMExperience')?.value) || null,
      highest_education: document.querySelector('input[name="highestEducation"]:checked')?.value || '',
      internet_access: document.querySelector('input[name="internetAccess"]:checked')?.value || '',
      used_latex_before: document.querySelector('input[name="usedLatex"]:checked')?.value || '',
      latex_duration: document.querySelector('input[name="latexDuration"]:checked')?.value || null,
      latex_school_status: document.querySelector('input[name="latexSchoolStatus"]:checked')?.value || '',
      primary_im_method: document.querySelector('input[name="primaryIMMethod"]:checked')?.value || '',
      primary_im_method_other: document.getElementById('primaryIMMethodOtherDetails')?.value || null,
      
      diff_16a: parseInt(document.querySelector('input[name="diff_16a"]:checked')?.value, 10) || null,
      diff_16b: parseInt(document.querySelector('input[name="diff_16b"]:checked')?.value, 10) || null,
      diff_16c: parseInt(document.querySelector('input[name="diff_16c"]:checked')?.value, 10) || null,
      diff_16d: parseInt(document.querySelector('input[name="diff_16d"]:checked')?.value, 10) || null,
      diff_16e: parseInt(document.querySelector('input[name="diff_16e"]:checked')?.value, 10) || null,
      diff_16f: parseInt(document.querySelector('input[name="diff_16f"]:checked')?.value, 10) || null,
      diff_16g: parseInt(document.querySelector('input[name="diff_16g"]:checked')?.value, 10) || null,
      diff_16h: parseInt(document.querySelector('input[name="diff_16h"]:checked')?.value, 10) || null,
      diff_16i: parseInt(document.querySelector('input[name="diff_16i"]:checked')?.value, 10) || null,
      diff_16j: parseInt(document.querySelector('input[name="diff_16j"]:checked')?.value, 10) || null,
      diff_16k: parseInt(document.querySelector('input[name="diff_16k"]:checked')?.value, 10) || null,
      diff_16l_other: document.getElementById('diff16lOther')?.value || null,

      pe1: parseInt(document.querySelector('input[name="pe1"]:checked')?.value, 10) || null,
      pe2: parseInt(document.querySelector('input[name="pe2"]:checked')?.value, 10) || null,
      pe3: parseInt(document.querySelector('input[name="pe3"]:checked')?.value, 10) || null,
      pe4: parseInt(document.querySelector('input[name="pe4"]:checked')?.value, 10) || null,
      ee1: parseInt(document.querySelector('input[name="ee1"]:checked')?.value, 10) || null,
      ee2: parseInt(document.querySelector('input[name="ee2"]:checked')?.value, 10) || null,
      ee3: parseInt(document.querySelector('input[name="ee3"]:checked')?.value, 10) || null,
      ee4: parseInt(document.querySelector('input[name="ee4"]:checked')?.value, 10) || null,
      si1: parseInt(document.querySelector('input[name="si1"]:checked')?.value, 10) || null,
      si2: parseInt(document.querySelector('input[name="si2"]:checked')?.value, 10) || null,
      si3: parseInt(document.querySelector('input[name="si3"]:checked')?.value, 10) || null,
      fc1: parseInt(document.querySelector('input[name="fc1"]:checked')?.value, 10) || null,
      fc2: parseInt(document.querySelector('input[name="fc2"]:checked')?.value, 10) || null,
      fc3: parseInt(document.querySelector('input[name="fc3"]:checked')?.value, 10) || null,
      
      bi1: parseInt(document.querySelector('input[name="bi1"]:checked')?.value, 10) || null,
      bi2: parseInt(document.querySelector('input[name="bi2"]:checked')?.value, 10) || null,
      bi3: parseInt(document.querySelector('input[name="bi3"]:checked')?.value, 10) || null,
      ub1: parseInt(document.querySelector('input[name="ub1"]:checked')?.value, 10) || null,
      ub2: parseInt(document.querySelector('input[name="ub2"]:checked')?.value, 10) || null,

      feedback_reason: document.getElementById('feedbackReason')?.value || '',
      feedback_barrier: document.getElementById('feedbackBarrier')?.value || ''
    };

    let visitorId = localStorage.getItem('latex_survey_visitor_id');
    if (!visitorId) {
      visitorId = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('latex_survey_visitor_id', visitorId);
    }
    
    payload.visitor_id = visitorId;

    try {
      // Direct Supabase Client Insertion (Matches your server's table structure: id, created_at, data)
      const SUPABASE_URL = "https://fkeujqzgqupvjcqreqcs.supabase.co";
      const SUPABASE_ANON_KEY = "sb_publishable_P2-r3rUN2REqf-jHtA-Img_CvegMFFf";
      
      // Ensure Supabase CDN script is loaded or use window.supabase
      const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const newEntry = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        data: payload
      };

      const { error } = await supabaseClient
        .from('responses')
        .insert([newEntry]);

      if (error) throw error;

      const shareTextarea = document.getElementById('shareTextMessage');
      if (shareTextarea) {
        shareTextarea.value = SHARE_MESSAGE;
      }

      clearDraft(); // Clear local storage draft upon success
      goToStep(6);
    } catch (err) {
      console.error('Submission Error:', err);
      alert('Failed to submit response. Please check your internet connection and try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Response';
      }
    }
  }

  const copyBtn = document.getElementById('copyShareBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const shareTextarea = document.getElementById('shareTextMessage');

  if (copyBtn && shareTextarea) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareTextarea.value);
        copyBtnText.textContent = 'Copied!';
        copyBtn.style.backgroundColor = '#16a34a';

        setTimeout(() => {
          copyBtnText.textContent = 'Copy Message';
          copyBtn.style.backgroundColor = '';
        }, 2000);
      } catch (err) {
        shareTextarea.select();
        document.execCommand('copy');
        copyBtnText.textContent = 'Copied!';
        setTimeout(() => {
          copyBtnText.textContent = 'Copy Message';
        }, 2000);
      }
    });
  }

  const pe4Radios = document.querySelectorAll('input[name="pe4"]');
  const midEncouragement = document.getElementById('midEncouragement');

  pe4Radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (midEncouragement) {
        midEncouragement.classList.remove('d-none');
      }
    });
  });

// Official list of Catanduanes high schools and integrated schools for autocomplete
  const knownSchools = [
    "Catanduanes National High School",
    "Sicmil Integrated School",
    "Magnesia National High School",
    "Calatagan National High School",
    "Tubli National High School",
    "Dariao National High School",
    "Codon National High School",
    "Cabcab National High School",
    "Dororian National High School",
    "San Jose National High School",
    "Lictin Integrated School",
    "Gigmoto Rural Development High School",
    "San Miguel Rural Development High School",
    "Antipolo National High School",
    "Buyo Integrated School",
    "Manambrag National High School",
    "Palumbanes Integrated School",
    "Milaviga Integrated School",
    "Baldoc Integrated School",
    "Baras Rural Development High School",
    "Bugao National High School",
    "Panganiban National High School",
    "Obi Integrated School",
    "Caramoran Rural Development High School",
    "Supang-Datag National High School",
    "Bagamanoc Rural Development High School",
    "Bato Rural Development High School",
    "Tinago National High School",
    "Hawan National High School",
    "Tucao-Maysuram Integrated School",
    "Mayngaway National High School",
    "Pagsangahan Integrated School",
    "San Andres Vocational School",
    "San Vicente National High School",
    "Agban National High School",
    "Leandro I Verceles Sr National High School",
    "Mabato National High School",
    "Cabugao Integrated School",
    "Bote Integrated School",
    "Cobo Integrated School",
    "Caramoran School of Fisheries",
    "Viga Rural Development High School",
    "Palta National High School",
    "Pandan School of Arts and Trades",
    "Tambongñon National High School",
    "Panganiban National High School (CAIC)",
    "Catanduanes State University - Laboratory School",
    "Immaculate Concepcion Seminary Academy",
    "Catanduanes Colleges (High School)",
    "Mabini Integrated School"
  ];

  // School Autocomplete Logic
  const schoolInput = document.getElementById('school_name');
  const suggestionsBox = document.getElementById('schoolSuggestions');

  if (schoolInput && suggestionsBox) {
    schoolInput.addEventListener('input', () => {
      const query = schoolInput.value.trim().toLowerCase();
      
      if (query.length === 0) {
        suggestionsBox.style.display = 'none';
        suggestionsBox.innerHTML = '';
        return;
      }

      // Filter schools matching the user's input
      const matches = knownSchools.filter(school => school.toLowerCase().includes(query));

      if (matches.length > 0) {
        suggestionsBox.style.display = 'block';
        suggestionsBox.innerHTML = matches.map(match => `
          <div class="suggestion-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 14px;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='white'">
            ${match}
          </div>
        `).join('');

        // Handle clicking on a suggestion
        suggestionsBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
          item.addEventListener('click', () => {
            schoolInput.value = matches[index];
            suggestionsBox.style.display = 'none';
          });
        });
      } else {
        // No matches found -> hidden dropdown so they can type a custom/new entry freely
        suggestionsBox.style.display = 'none';
      }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!schoolInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = 'none';
      }
    });
  }

  // Official list of Catanduanes municipalities for autocomplete
  const knownMunicipalities = [
    "Bagamanoc",
    "Baras",
    "Bato",
    "Caramoran",
    "Gigmoto",
    "Pandan",
    "Panganiban",
    "San Andres",
    "San Miguel",
    "Viga",
    "Virac"
  ];

  const muniInput = document.getElementById('municipality');
  const muniSuggestionsBox = document.getElementById('municipalitySuggestions');

  if (muniInput && muniSuggestionsBox) {
    muniInput.addEventListener('input', () => {
      const query = muniInput.value.trim().toLowerCase();
      
      if (query.length === 0) {
        muniSuggestionsBox.style.display = 'none';
        muniSuggestionsBox.innerHTML = '';
        return;
      }

      const matches = knownMunicipalities.filter(m => m.toLowerCase().includes(query));

      if (matches.length > 0) {
        muniSuggestionsBox.style.display = 'block';
        muniSuggestionsBox.innerHTML = matches.map(match => `
          <div class="suggestion-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 14px;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='white'">
            ${match}
          </div>
        `).join('');

        muniSuggestionsBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
          item.addEventListener('click', () => {
            muniInput.value = matches[index];
            muniSuggestionsBox.style.display = 'none';
          });
        });
      } else {
        muniSuggestionsBox.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!muniInput.contains(e.target) && !muniSuggestionsBox.contains(e.target)) {
        muniSuggestionsBox.style.display = 'none';
      }
    });
  }

  // --- LOCALSTORAGE DRAFT SAVING LOGIC ---
  const STORAGE_KEY = 'latex_survey_draft_v1';
  const saveStatusEl = document.getElementById('saveStatus');
  const floatingStatusEl = document.getElementById('floatingSaveStatus');

  // Helper function to update both indicators cleanly
  function updateStatusText(text, opacityValue) {
    [saveStatusEl, floatingStatusEl].forEach(el => {
      if (el) {
        el.textContent = text;
        el.style.opacity = opacityValue;
      }
    });
  }
  let hasUserInteracted = false; // Tracks if they actually typed/clicked anything

  // Function to save all form values
  function saveDraft() {
    if (!surveyForm || !hasUserInteracted) return;

    updateStatusText('Saving...', '0.9');

    const formData = new FormData(surveyForm);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    // Explicitly grab all text, number inputs, and textareas by name OR ID to ensure nothing is missed
    surveyForm.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
      const identifier = el.name || el.id;
      if (identifier) {
        data[identifier] = el.value;
      }
    });

    const consentCheck = document.getElementById('consentCheck');
    if (consentCheck) data['consentCheck'] = consentCheck.checked;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      setTimeout(() => {
        updateStatusText('All changes saved', '0.7');
      }, 400);

    } catch (err) {
      console.error('Failed to save draft', err);
      updateStatusText('Could not save draft', '1');
    }
  }

  // --- ROBUST DRAFT RESTORATION FUNCTION ---
  function loadDraft() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      
      const data = JSON.parse(saved);
      hasUserInteracted = true; 

      // Wait a tiny tick for the DOM to be fully ready
      setTimeout(() => {
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value === undefined || value === null || value === '') return;

          // Find elements matching either the name attribute or the exact ID
          const elements = surveyForm.querySelectorAll(`[name="${key}"], #${CSS.escape(key)}`);
          
          elements.forEach(el => {
            if (el.type === 'checkbox') {
              el.checked = (value === true || value === 'true' || el.value === value);
            } else if (el.type === 'radio') {
              if (el.value === value) {
                el.checked = true;
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            } else {
              // Handles text, number inputs (age, years teaching), textareas, and select inputs
              el.value = value;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        });

        // Show the status quietly if data was successfully restored
        if (Object.keys(data).length > 0) {
          updateStatusText('All changes saved', '0.7');
        }
      }, 50);

    } catch (err) {
      console.error('Failed to load draft', err);
    }
  }

  // Load draft when page opens
  loadDraft();

  // Trigger saves upon actual user input/change
  let saveTimeout;
  if (surveyForm) {
    ['input', 'change'].forEach(eventType => {
      surveyForm.addEventListener(eventType, () => {
        hasUserInteracted = true; // User has now typed/clicked something!
        
        clearTimeout(saveTimeout);
        // Show saving immediately on input
        if (saveStatusEl) {
          saveStatusEl.textContent = 'Saving...';
          saveStatusEl.style.opacity = '0.9';
        }

        saveTimeout = setTimeout(saveDraft, 600); // Debounce actual save by 600ms
      });
    });
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
  }

  updatePart2Guidance();
});
