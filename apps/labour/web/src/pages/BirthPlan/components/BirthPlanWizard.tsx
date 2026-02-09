import { useCallback, useState } from 'react';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPrinter,
  IconTrash,
} from '@tabler/icons-react';
import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useBirthPlanStorage, type BirthPlanData } from '../hooks/useBirthPlanStorage';
import { exportAsPDF } from '../utils/exportUtils';
import { formSteps, type FormField, type FormStep } from './formSections';
import classes from './BirthPlanWizard.module.css';

export function BirthPlanWizard() {
  const { data, updateField, clearAll } = useBirthPlanStorage();
  const [currentStep, setCurrentStep] = useState(1);

  const handleClearAll = useCallback(() => {
    notifications.show({
      id: 'clear-birth-plan',
      title: 'Clear all data?',
      message: (
        <Group>
          <Text size="sm">This will remove all your birth plan data. This cannot be undone.</Text>
          <Group gap="xs">
            <Button
              size="xs"
              color="red"
              radius="xl"
              onClick={() => {
                clearAll();
                setCurrentStep(1);
                notifications.hide('clear-birth-plan');
                notifications.show({
                  title: 'Data cleared',
                  message: 'Your birth plan has been reset.',
                  color: 'teal',
                  autoClose: 3000,
                });
              }}
            >
              Clear data
            </Button>
            <Button
              size="xs"
              radius="xl"
              variant="subtle"
              onClick={() => notifications.hide('clear-birth-plan')}
            >
              Cancel
            </Button>
          </Group>
        </Group>
      ),
      color: 'red',
      radius: 'lg',
      autoClose: false,
      withCloseButton: true,
    });
  }, [clearAll]);

  const handleExportPDF = useCallback(() => {
    exportAsPDF(data);
  }, [data]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < formSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const currentStepData = formSteps.find((s) => s.id === currentStep);

  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <h1 className={classes.title}>Your Birth Plan</h1>
        <p className={classes.subtitle}>
          Create a personalised birth plan to share with your care team. Your preferences are saved
          automatically and stay on your device.
        </p>
      </header>

      <ProgressIndicator steps={formSteps} currentStep={currentStep} onStepClick={goToStep} />

      {currentStepData && (
        <div className={classes.stepContainer} key={currentStep}>
          <div className={classes.stepHeader}>
            <div className={classes.stepNumber}>{currentStep}</div>
            <h2 className={classes.stepTitle}>{currentStepData.title}</h2>
          </div>

          {currentStepData.sections.map((section) => (
            <SectionRenderer
              key={section.id}
              section={section}
              data={data}
              updateField={updateField}
            />
          ))}

          <nav className={classes.navigation} aria-label="Form navigation">
            {currentStep > 1 ? (
              <button type="button" className={classes.backButton} onClick={handleBack}>
                <IconArrowLeft size={16} />
                Back
              </button>
            ) : (
              <div />
            )}
            {currentStep < formSteps.length ? (
              <button type="button" className={classes.nextButton} onClick={handleNext}>
                Continue
                <IconArrowRight size={18} />
              </button>
            ) : (
              <button type="button" className={classes.completeButton} onClick={handleExportPDF}>
                <IconCheck size={18} />
                Complete & Print
              </button>
            )}
          </nav>
        </div>
      )}

      <div className={classes.actionsBar}>
        <button type="button" className={classes.exportButton} onClick={handleExportPDF}>
          <IconPrinter size={18} />
          Print / Save PDF
        </button>
        <button type="button" className={classes.clearButton} onClick={handleClearAll}>
          <IconTrash size={18} />
          Clear all data
        </button>
      </div>

      <div className={classes.autosaveIndicator}>
        <IconDeviceFloppy size={16} />
        <span>Saved to this device only</span>
      </div>
    </div>
  );
}

interface ProgressIndicatorProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

function ProgressIndicator({ steps, currentStep, onStepClick }: ProgressIndicatorProps) {
  return (
    <nav className={classes.progressContainer} aria-label="Form progress">
      {steps.map((step, index) => (
        <div key={step.id} className={classes.progressStep}>
          <button
            type="button"
            className={`${classes.progressDot} ${
              step.id === currentStep
                ? classes.progressDotActive
                : step.id < currentStep
                  ? classes.progressDotComplete
                  : ''
            }`}
            onClick={() => onStepClick(step.id)}
            aria-current={step.id === currentStep ? 'step' : undefined}
            aria-label={`Step ${step.id}: ${step.title}`}
          >
            {step.id}
          </button>
          {index < steps.length - 1 && (
            <div
              className={`${classes.progressLine} ${
                step.id < currentStep ? classes.progressLineActive : ''
              }`}
            />
          )}
        </div>
      ))}
    </nav>
  );
}

interface SectionRendererProps {
  section: FormStep['sections'][number];
  data: BirthPlanData;
  updateField: <K extends keyof BirthPlanData>(field: K, value: BirthPlanData[K]) => void;
}

function SectionRenderer({ section, data, updateField }: SectionRendererProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <fieldset className={classes.sectionContainer}>
      <div className={classes.sectionHeader}>
        <legend className={classes.sectionTitle}>{section.title}</legend>
        {section.helpText && (
          <button
            type="button"
            className={classes.helpToggle}
            onClick={() => setShowHelp(!showHelp)}
            aria-expanded={showHelp}
            aria-label={showHelp ? 'Hide help information' : 'Show help information'}
          >
            <IconInfoCircle size={18} />
            <span className={classes.helpToggleLabel}>{showHelp ? 'Hide info' : 'More info'}</span>
            {showHelp ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </button>
        )}
      </div>
      {section.description && <p className={classes.sectionDescription}>{section.description}</p>}
      {showHelp && section.helpText && (
        <div className={classes.helpText}>
          <p>{section.helpText}</p>
        </div>
      )}
      {section.fields.map((field) => (
        <FieldRenderer key={field.id} field={field} data={data} updateField={updateField} />
      ))}
    </fieldset>
  );
}

interface FieldRendererProps {
  field: FormField;
  data: BirthPlanData;
  updateField: <K extends keyof BirthPlanData>(field: K, value: BirthPlanData[K]) => void;
}

function FieldRenderer({ field, data, updateField }: FieldRendererProps) {
  const value = data[field.id];

  if (field.type === 'text') {
    return (
      <div className={classes.fieldGroup}>
        <label htmlFor={field.id} className={classes.fieldLabel}>
          {field.label}
        </label>
        <input
          id={field.id}
          type="text"
          className={classes.textInput}
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => updateField(field.id, e.target.value as BirthPlanData[typeof field.id])}
        />
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div className={classes.fieldGroup}>
        <label htmlFor={field.id} className={classes.fieldLabel}>
          {field.label}
        </label>
        <input
          id={field.id}
          type="date"
          className={classes.dateInput}
          value={(value as string) || ''}
          onChange={(e) => updateField(field.id, e.target.value as BirthPlanData[typeof field.id])}
        />
      </div>
    );
  }

  if (field.type === 'freetext') {
    return (
      <div className={classes.fieldGroup}>
        <label htmlFor={field.id} className={classes.fieldLabel}>
          {field.label}
        </label>
        <textarea
          id={field.id}
          className={classes.textarea}
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => updateField(field.id, e.target.value as BirthPlanData[typeof field.id])}
          rows={3}
        />
      </div>
    );
  }

  if (field.type === 'single') {
    return (
      <div className={classes.fieldGroup} role="radiogroup" aria-labelledby={`${field.id}-label`}>
        <span id={`${field.id}-label`} className={classes.fieldLabel}>
          {field.label}
        </span>
        <div className={classes.radioGroup}>
          {field.options?.map((option) => (
            <label
              key={option.value}
              className={`${classes.radioCard} ${
                value === option.value ? classes.radioCardSelected : ''
              }`}
            >
              <input
                type="radio"
                name={field.id}
                value={option.value}
                checked={value === option.value}
                onChange={() =>
                  updateField(field.id, option.value as BirthPlanData[typeof field.id])
                }
                className={classes.radioInput}
              />
              <span className={classes.radioCardLabel}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'multi') {
    const arrayValue = (value as string[]) || [];
    return (
      <div className={classes.fieldGroup} role="group" aria-labelledby={`${field.id}-label`}>
        <span id={`${field.id}-label`} className={classes.fieldLabel}>
          {field.label}
        </span>
        <div className={classes.checkboxGroup}>
          {field.options?.map((option) => {
            const isChecked = arrayValue.includes(option.value);
            return (
              <label
                key={option.value}
                className={`${classes.checkboxCard} ${
                  isChecked ? classes.checkboxCardSelected : ''
                }`}
              >
                <input
                  type="checkbox"
                  name={field.id}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => {
                    const newValue = isChecked
                      ? arrayValue.filter((v) => v !== option.value)
                      : [...arrayValue, option.value];
                    updateField(field.id, newValue as BirthPlanData[typeof field.id]);
                  }}
                  className={classes.checkboxInput}
                />
                <span
                  className={`${classes.checkboxIndicator} ${
                    isChecked ? classes.checkboxIndicatorSelected : ''
                  }`}
                >
                  {isChecked && <IconCheck size={14} color="white" />}
                </span>
                <span className={classes.checkboxCardLabel}>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
