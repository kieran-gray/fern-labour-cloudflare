import { useCallback, useMemo, useState } from 'react';
import { AppMode, useLabourSession } from '@base/contexts';
import { useLabourClient, usePlanLabour } from '@base/hooks';
import { validateLabourName } from '@lib';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconInfoCircle,
  IconSparkles,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { DatePickerInput } from '@mantine/dates';
import classes from './Plan.module.css';
import baseClasses from '@styles/base.module.css';

type Step = 1 | 2 | 3;

interface FormData {
  dueDate: Date;
  firstLabour: 'true' | 'false';
  labourName: string;
}

export default function Plan() {
  const navigate = useNavigate();
  const { setMode, setLabourId } = useLabourSession();
  const client = useLabourClient();
  const mutation = usePlanLabour(client);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    dueDate: new Date(),
    firstLabour: 'true',
    labourName: '',
  });
  const [nameError, setNameError] = useState<string | null>(null);

  const updateFormData = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === 'labourName') {
      setNameError(null);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    if (formData.labourName) {
      const error = validateLabourName(formData.labourName);
      if (error) {
        setNameError(error);
        return;
      }
    }

    const firstLabour = formData.firstLabour === 'true';
    const dueDate = formData.dueDate;
    const labourName = formData.labourName || undefined;

    mutation.mutate(
      { firstLabour, dueDate, labourName },
      {
        onSuccess: (data) => {
          setMode(AppMode.Birth);
          setLabourId(data.labour_id);
          setTimeout(() => navigate('/?tab=details'), 100);
        },
      }
    );
  }, [formData, mutation, setMode, setLabourId, navigate]);

  const formatDate = useMemo(() => {
    return formData.dueDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [formData.dueDate]);

  const renderProgressDots = () => (
    <div className={classes.progressContainer}>
      {[1, 2, 3].map((step, index) => (
        <div key={step} className={classes.progressStep}>
          <div
            className={`${classes.progressDot} ${
              step === currentStep
                ? classes.progressDotActive
                : step < currentStep
                  ? classes.progressDotComplete
                  : ''
            }`}
          />
          {index < 2 && (
            <div
              className={`${classes.progressLine} ${
                step < currentStep ? classes.progressLineActive : ''
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className={classes.stepContainer} key="step1">
      <div className={classes.stepHeader}>
        <div className={classes.stepNumber}>1</div>
        <h3 className={classes.stepTitle}>When is your baby due?</h3>
      </div>

      <div className={classes.fieldGroup}>
        <DatePickerInput
          placeholder="Select your due date"
          rightSection={<IconCalendar size={20} stroke={1.5} />}
          valueFormat="DD MMMM YYYY"
          size="lg"
          value={formData.dueDate}
          onChange={(date) => date && updateFormData('dueDate', date)}
          classNames={{
            input: classes.datePickerInput,
            section: classes.datePickerSection,
            weekday: classes.datePickerWeekday,
            levelsGroup: classes.datePickerDropdown,
          }}
        />
      </div>

      <div className={classes.tipBox}>
        <IconInfoCircle size={20} className={classes.tipIcon} />
        <p className={classes.tipText}>
          <span className={classes.tipHighlight}>Did you know?</span> Only about 4% of babies arrive
          on their due date. We'll use this as a guide to help you prepare.
        </p>
      </div>

      <div className={classes.navigation}>
        <button type="button" className={classes.nextButton} onClick={handleNext}>
          Continue
          <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={classes.stepContainer} key="step2">
      <div className={classes.stepHeader}>
        <div className={classes.stepNumber}>2</div>
        <h3 className={classes.stepTitle}>Is this your first labour?</h3>
      </div>

      <div className={classes.fieldGroup}>
        <p className={classes.fieldDescription}>
          This helps us give you more accurate guidance on when to head to the hospital.
        </p>
        <div className={classes.radioGroup}>
          <label
            className={`${classes.radioCard} ${
              formData.firstLabour === 'true' ? classes.radioCardSelected : ''
            }`}
          >
            <input
              type="radio"
              name="firstLabour"
              value="true"
              checked={formData.firstLabour === 'true'}
              onChange={() => updateFormData('firstLabour', 'true')}
              className={classes.radioInput}
            />
            <span className={classes.radioCardIcon}>&#x1F476;</span>
            <span className={classes.radioCardLabel}>Yes, my first</span>
            <br />
            <span className={classes.radioCardDescription}>
              First-time labours are often longer
            </span>
          </label>

          <label
            className={`${classes.radioCard} ${
              formData.firstLabour === 'false' ? classes.radioCardSelected : ''
            }`}
          >
            <input
              type="radio"
              name="firstLabour"
              value="false"
              checked={formData.firstLabour === 'false'}
              onChange={() => updateFormData('firstLabour', 'false')}
              className={classes.radioInput}
            />
            <span className={classes.radioCardIcon}>&#x1F31F;</span>
            <span className={classes.radioCardLabel}>No, I've done this before</span>
            <br />
            <span className={classes.radioCardDescription}>
              Subsequent labours can progress faster
            </span>
          </label>
        </div>
      </div>

      <div className={classes.navigation}>
        <button type="button" className={classes.backButton} onClick={handleBack}>
          <IconArrowLeft size={16} />
          Back
        </button>
        <button type="button" className={classes.nextButton} onClick={handleNext}>
          Continue
          <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={classes.stepContainer} key="step3">
      <div className={classes.celebration}>
        <span className={classes.celebrationIcon}>&#x1F33F;</span>
        <h3 className={classes.celebrationTitle}>Almost there!</h3>
        <p className={classes.celebrationText}>
          Would you like to give your labour a name? This is totally optional, but we'll use it when
          sending updates to your subscribers.
        </p>
      </div>

      <div className={classes.fieldGroup}>
        <div className={classes.inputWrapper}>
          <input
            type="text"
            className={`${classes.customInput} ${nameError ? classes.inputError : ''}`}
            placeholder="e.g. Baby Fern's arrival"
            value={formData.labourName}
            onChange={(e) => updateFormData('labourName', e.target.value)}
          />
          <IconSparkles size={20} className={classes.inputIcon} />
        </div>
        {nameError && <p className={classes.errorMessage}>{nameError}</p>}
      </div>

      <div className={classes.summaryList}>
        <div className={classes.summaryItem}>
          <span className={classes.summaryLabel}>Due date</span>
          <span className={classes.summaryValue}>{formatDate}</span>
        </div>
        <div className={classes.summaryItem}>
          <span className={classes.summaryLabel}>First labour</span>
          <span className={classes.summaryValue}>
            {formData.firstLabour === 'true' ? 'Yes' : 'No'}
          </span>
        </div>
        {formData.labourName && (
          <div className={classes.summaryItem}>
            <span className={classes.summaryLabel}>Name</span>
            <span className={classes.summaryValue}>{formData.labourName}</span>
          </div>
        )}
      </div>

      <div className={classes.navigation}>
        <button type="button" className={classes.backButton} onClick={handleBack}>
          <IconArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          className={`${classes.nextButton} ${classes.submitButton}`}
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <span className={classes.loadingSpinner} />
              Setting up...
            </>
          ) : (
            <>
              <IconCheck size={18} />
              Start Tracking
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className={baseClasses.card}>
      <div className={classes.container}>
        <header className={classes.header}>
          <div className={classes.headerDecoration} />
          <p className={classes.greeting}>Welcome to Fern Labour</p>
          <h1 className={classes.title}>
            Plan your <span className={classes.titleAccent}>journey</span>
          </h1>
          <p className={classes.subtitle}>
            Let's set up a few things so we can support you through every contraction.
          </p>
        </header>

        {renderProgressDots()}

        <div className={classes.formCard}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
}
