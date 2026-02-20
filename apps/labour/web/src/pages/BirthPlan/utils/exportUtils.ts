import { notifications } from '@mantine/notifications';
import { formSteps } from '../components/formSections';
import type { BirthPlanData } from '../hooks/useBirthPlanStorage';

function getOptionLabel(fieldId: string, value: string): string {
  for (const step of formSteps) {
    for (const section of step.sections) {
      for (const field of section.fields) {
        if (field.id === fieldId && field.options) {
          const option = field.options.find((o) => o.value === value);
          if (option) {
            return option.label;
          }
        }
      }
    }
  }
  return value;
}

function formatDate(dateString: string): string {
  if (!dateString) {
    return '';
  }
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Helper to create a field row with optional note
function row(label: string, value: string, note?: string): string {
  if (!value) {
    return '';
  }
  return `
    <div class="row">
      <div class="field">
        <span class="label">${label}</span>
        <span class="value">${value}</span>
      </div>
      ${note ? `<div class="note">${note}</div>` : ''}
    </div>
  `;
}

function generateDetailedContent(data: BirthPlanData): string {
  const sections: string[] = [];

  // Personal Details
  if (data.fullName || data.dueDate) {
    sections.push(`
      <section class="section highlight">
        <h2>Personal Details</h2>
        ${row('Name', data.fullName || '')}
        ${row('Due Date', data.dueDate ? formatDate(data.dueDate) : '')}
      </section>
    `);
  }

  // Birth Location & Environment
  const hasLocationData =
    data.birthLocation ||
    data.birthLocationComments ||
    data.birthingEquipment ||
    data.birthingEquipmentComments ||
    (data.specialFacilities && data.specialFacilities.length > 0) ||
    data.specialFacilitiesComments;

  if (hasLocationData) {
    sections.push(`
      <section class="section">
        <h2>Birth Location & Environment</h2>
        ${row(
          'Preferred Location',
          data.birthLocation ? getOptionLabel('birthLocation', data.birthLocation) : '',
          data.birthLocationComments
        )}
        ${row(
          'Birthing Equipment',
          data.birthingEquipment === 'yes' ? 'Would like to use birthing equipment' : '',
          data.birthingEquipmentComments
        )}
        ${row(
          'Special Facilities',
          data.specialFacilities && data.specialFacilities.length > 0
            ? data.specialFacilities.map((v) => getOptionLabel('specialFacilities', v)).join(', ')
            : '',
          data.specialFacilitiesComments
        )}
        ${data.otherLocationComments ? `<div class="row"><div class="note standalone">${data.otherLocationComments}</div></div>` : ''}
      </section>
    `);
  }

  // Companions
  const hasCompanionData =
    data.companionsDuringLabour ||
    data.companionNames ||
    data.companionsDuringForceps ||
    data.companionsDuringCaesarean;

  if (hasCompanionData) {
    sections.push(`
      <section class="section">
        <h2>Companions & Support</h2>
        ${row('Companion Names', data.companionNames || '')}
        ${row(
          'During Labour',
          data.companionsDuringLabour
            ? getOptionLabel('companionsDuringLabour', data.companionsDuringLabour)
            : ''
        )}
        ${row(
          'During Forceps/Vacuum',
          data.companionsDuringForceps
            ? getOptionLabel('companionsDuringForceps', data.companionsDuringForceps)
            : ''
        )}
        ${row(
          'During Caesarean',
          data.companionsDuringCaesarean
            ? getOptionLabel('companionsDuringCaesarean', data.companionsDuringCaesarean)
            : ''
        )}
      </section>
    `);
  }

  // Labour Preferences
  const hasLabourData =
    data.monitoringDiscussed ||
    data.monitoringComments ||
    data.activityDuringLabour ||
    data.activityComments ||
    (data.labourPositions && data.labourPositions.length > 0) ||
    data.staffInTraining ||
    data.otherLabourPreferences;

  if (hasLabourData) {
    sections.push(`
      <section class="section">
        <h2>Labour Preferences</h2>
        ${row(
          'Monitoring',
          data.monitoringDiscussed === 'yes' ? 'Discussed with care team' : '',
          data.monitoringComments
        )}
        ${row(
          'Movement During Labour',
          data.activityDuringLabour
            ? getOptionLabel('activityDuringLabour', data.activityDuringLabour)
            : '',
          data.activityComments
        )}
        ${row(
          'Preferred Positions',
          data.labourPositions && data.labourPositions.length > 0
            ? data.labourPositions.map((v) => getOptionLabel('labourPositions', v)).join(', ')
            : ''
        )}
        ${row(
          'Staff in Training',
          data.staffInTraining === 'yes' ? 'Discussed with care team' : ''
        )}
        ${data.otherLabourPreferences ? `<div class="row"><div class="note standalone">${data.otherLabourPreferences}</div></div>` : ''}
      </section>
    `);
  }

  // Pain Relief
  const hasPainReliefData =
    (data.painRelief && data.painRelief.length > 0) || data.painReliefComments;

  if (hasPainReliefData) {
    sections.push(`
      <section class="section">
        <h2>Pain Relief</h2>
        ${row(
          'Preferred Methods',
          data.painRelief && data.painRelief.length > 0
            ? data.painRelief.map((v) => getOptionLabel('painRelief', v)).join(', ')
            : '',
          data.painReliefComments
        )}
      </section>
    `);
  }

  // Medical Procedures
  const hasMedicalData =
    data.episiotomyDiscussed ||
    data.episiotomyComments ||
    data.placentaDiscussed ||
    data.placentaComments;

  if (hasMedicalData) {
    sections.push(`
      <section class="section">
        <h2>Medical Procedures</h2>
        ${row(
          'Episiotomy',
          data.episiotomyDiscussed === 'yes' ? 'Discussed with care team' : '',
          data.episiotomyComments
        )}
        ${row(
          'Placenta Delivery',
          data.placentaDiscussed === 'yes' ? 'Discussed with care team' : '',
          data.placentaComments
        )}
      </section>
    `);
  }

  // Immediately After Birth
  const hasAfterBirthData =
    data.skinToSkin || data.postBirthPreferences || data.feedingChoice || data.feedingComments;

  if (hasAfterBirthData) {
    sections.push(`
      <section class="section">
        <h2>Immediately After Birth</h2>
        ${row(
          'Skin-to-Skin Contact',
          data.skinToSkin ? getOptionLabel('skinToSkin', data.skinToSkin) : '',
          data.postBirthPreferences
        )}
        ${row(
          'Feeding Choice',
          data.feedingChoice ? getOptionLabel('feedingChoice', data.feedingChoice) : '',
          data.feedingComments
        )}
      </section>
    `);
  }

  // Vitamin K & Medical
  const hasVitaminKData = data.vitaminKConsent || data.otherPostBirthPreferences;

  if (hasVitaminKData) {
    sections.push(`
      <section class="section">
        <h2>Newborn Care</h2>
        ${row(
          'Vitamin K',
          data.vitaminKConsent ? getOptionLabel('vitaminKConsent', data.vitaminKConsent) : '',
          data.otherPostBirthPreferences
        )}
      </section>
    `);
  }

  // Special Requirements
  const hasSpecialRequirements =
    (data.specialRequirements && data.specialRequirements.length > 0) ||
    data.specialRequirementsDetails;

  if (hasSpecialRequirements) {
    sections.push(`
      <section class="section important">
        <h2>Special Requirements</h2>
        ${row(
          'Requirements',
          data.specialRequirements && data.specialRequirements.length > 0
            ? data.specialRequirements
                .map((v) => getOptionLabel('specialRequirements', v))
                .join(', ')
            : '',
          data.specialRequirementsDetails
        )}
      </section>
    `);
  }

  // General Comments
  if (data.generalComments) {
    sections.push(`
      <section class="section">
        <h2>Additional Notes</h2>
        <div class="row"><div class="note standalone">${data.generalComments}</div></div>
      </section>
    `);
  }

  return sections.join('');
}

export function exportAsPDF(data: BirthPlanData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    notifications.show({
      title: 'Pop-up blocked',
      message: 'Please allow pop-ups to generate your birth plan PDF.',
      color: 'yellow',
      autoClose: 5000,
    });
    return;
  }

  const content = generateDetailedContent(data);
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Birth Plan - ${data.fullName || 'My Birth Plan'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Quicksand:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 18mm 12mm 20mm 12mm;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 10pt;
          line-height: 1.35;
          color: #333;
          background: white;
          max-width: 800px;
          margin: 0 auto;
          padding: 16px;
        }
        
        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 2px solid #ff7964;
          margin-bottom: 12px;
        }
        
        .brand {
          font-family: 'Poppins', sans-serif;
          font-size: 16pt;
          font-weight: 600;
          color: #ff7964;
        }
        
        .doc-info {
          text-align: right;
          font-size: 9pt;
          color: #666;
        }
        
        .doc-info strong {
          font-size: 12pt;
          color: #333;
          display: block;
        }
        
        /* Sections */
        .section {
          margin-bottom: 10px;
          page-break-inside: avoid;
        }
        
        .section h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 11pt;
          font-weight: 600;
          color: #ff7964;
          padding: 4px 0;
          border-bottom: 1px solid #ffd4cc;
          margin-bottom: 6px;
        }
        
        .section.highlight {
          background: #fff8f6;
          border: 1px solid #ffeae6;
          border-radius: 4px;
          padding: 8px;
        }
        
        .section.highlight h2 {
          margin: -8px -8px 8px -8px;
          padding: 6px 8px;
          background: #ffeae6;
          border-bottom: none;
          border-radius: 3px 3px 0 0;
        }
        
        .section.important {
          background: #fffbf0;
          border: 1px solid #ffe4b3;
          border-radius: 4px;
          padding: 8px;
        }
        
        .section.important h2 {
          color: #b8860b;
          margin: -8px -8px 8px -8px;
          padding: 6px 8px;
          background: #fff3d4;
          border-bottom: none;
          border-radius: 3px 3px 0 0;
        }
        
        /* Rows - contain field + optional note */
        .row {
          border-bottom: 1px solid #f0ebe8;
          padding: 5px 0;
        }
        
        .row:last-child {
          border-bottom: none;
        }
        
        /* Fields */
        .field {
          display: flex;
          gap: 12px;
          align-items: baseline;
        }
        
        .field .label {
          font-weight: 600;
          color: #555;
          min-width: 140px;
          flex-shrink: 0;
          font-size: 9pt;
        }
        
        .field .value {
          color: #222;
          flex: 1;
        }
        
        /* Notes - attached to their field */
        .note {
          background: #f9f7f5;
          border-left: 2px solid #ff7964;
          padding: 4px 8px;
          margin: 4px 0 0 152px;
          font-size: 9pt;
          color: #555;
          border-radius: 0 3px 3px 0;
        }
        
        .note.standalone {
          margin-left: 0;
        }
        
        /* Footer */
        .footer {
          margin-top: 14px;
          padding-top: 8px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: 8pt;
          color: #888;
        }
        
        .footer-brand {
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          color: #ff7964;
        }
        
        .disclaimer {
          max-width: 400px;
          text-align: right;
          line-height: 1.3;
        }
        
        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #999;
        }
        
        /* Print-specific */
        @media print {
          body {
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .section {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <header class="header">
        <span class="brand">Fern Labour</span>
        <div class="doc-info">
          <strong>Birth Plan</strong>
          ${data.fullName ? `${data.fullName}` : ''}
          ${data.dueDate ? ` · Due: ${formatDate(data.dueDate)}` : ''}
        </div>
      </header>
      
      <main>
        ${content || '<div class="empty-state"><p>No preferences have been recorded yet.</p></div>'}
      </main>
      
      <footer class="footer">
        <div>
          <span class="footer-brand">Fern Labour</span>
          <span> · Generated ${currentDate}</span>
        </div>
        <div class="disclaimer">
          Please discuss all options with your healthcare provider. Circumstances during labour may require flexibility.
        </div>
      </footer>
    </body>
    </html>
  `;

  printWindow.document.write(html);

  let printed = false;
  const triggerPrint = () => {
    if (printed) {
      return;
    }
    printed = true;
    printWindow.focus();
    printWindow.print();
  };

  printWindow.onload = triggerPrint;
  printWindow.document.close();

  setTimeout(triggerPrint, 500);
}
