import { useCallback, useMemo, useState } from 'react';
import { useGuestPlanStorage } from '@base/hooks/useGuestPlanStorage';
import { validateLabourName } from '@lib';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBabyCarriage,
  IconCalendar,
  IconCheck,
  IconInfoCircle,
  IconSparkles,
} from '@tabler/icons-react';
import { Button, Group, Radio, Stepper, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import classes from './GuestPlan.module.css';
import baseClasses from '@styles/base.module.css';

type Step = 1 | 2 | 3;

interface FormData {
  dueDate: Date;
  firstLabour: 'true' | 'false';
  labourName: string;
}

interface GuestPlanProps {
  onComplete: () => void;
  onBack: () => void;
}

export function GuestPlan({ onComplete, onBack }: GuestPlanProps) {
  const guestStorage = useGuestPlanStorage();

  const [currentStep, setCurrentStep] = useState<Step>(() => {
    const savedPlan = guestStorage.getPendingPlan();
    return savedPlan ? 3 : 1;
  });

  const [formData, setFormData] = useState<FormData>(() => {
    const savedPlan = guestStorage.getPendingPlan();
    if (savedPlan) {
      return {
        dueDate: new Date(savedPlan.dueDate),
        firstLabour: savedPlan.firstLabour ? 'true' : 'false',
        labourName: savedPlan.labourName || '',
      };
    }
    return {
      dueDate: new Date(),
      firstLabour: 'true',
      labourName: '',
    };
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
    } else {
      onBack();
    }
  }, [currentStep, onBack]);

  const handleSubmit = useCallback(() => {
    if (formData.labourName) {
      const error = validateLabourName(formData.labourName);
      if (error) {
        setNameError(error);
        return;
      }
    }

    guestStorage.savePlan({
      dueDate: formData.dueDate.toISOString(),
      firstLabour: formData.firstLabour === 'true',
      labourName: formData.labourName || undefined,
    });

    onComplete();
  }, [formData, guestStorage, onComplete]);

  const formatDate = useMemo(() => {
    return formData.dueDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [formData.dueDate]);

  const renderStep1 = () => (
    <div className={classes.stepContainer} key="step1">
      <h3 className={classes.stepTitle}>When is your baby due?</h3>

      <DatePickerInput
        placeholder="Select your due date"
        rightSection={<IconCalendar size={18} stroke={1.5} />}
        valueFormat="DD MMMM YYYY"
        size="md"
        value={formData.dueDate}
        onChange={(date) => date && updateFormData('dueDate', date)}
        classNames={{
          input: classes.datePickerInput,
          section: classes.inputSection,
          weekday: classes.datePickerWeekday,
          levelsGroup: classes.datePickerDropdown,
        }}
      />

      <div className={classes.tipBox}>
        <IconInfoCircle size={18} className={classes.tipIcon} />
        <Text className={classes.tipText}>
          <span className={classes.tipHighlight}>Did you know?</span> Only about 4% of babies arrive
          on their due date.
        </Text>
      </div>

      <Group justify="space-between" className={classes.navigation}>
        <Button
          type="button"
          variant="default"
          onClick={handleBack}
          leftSection={<IconArrowLeft size={16} />}
          radius="xl"
          className={classes.backButton}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          rightSection={<IconArrowRight size={16} />}
          radius="xl"
          className={classes.nextButton}
        >
          Continue
        </Button>
      </Group>
    </div>
  );

  const renderStep2 = () => (
    <div className={classes.stepContainer} key="step2">
      <h3 className={classes.stepTitle}>Is this your first labour?</h3>

      <Text className={classes.fieldDescription}>
        This helps us give you more accurate guidance on when to head to the hospital.
      </Text>

      <Radio.Group
        value={formData.firstLabour}
        onChange={(value) => updateFormData('firstLabour', value as 'true' | 'false')}
      >
        <div className={classes.radioGroup}>
          <div
            className={classes.radioCard}
            data-selected={formData.firstLabour === 'true' || undefined}
          >
            <Radio
              value="true"
              classNames={{
                root: classes.radioRoot,
                body: classes.radioBody,
                radio: classes.radioControl,
                labelWrapper: classes.radioLabelWrapper,
                label: classes.radioLabel,
              }}
              label={
                <div>
                  <span className={classes.radioCardIcon}>
                    <IconBabyCarriage size={20} />
                  </span>
                  <span className={classes.radioCardTitle}>Yes, my first</span>
                  <span className={classes.radioCardDescription}>
                    First-time labours are often longer
                  </span>
                </div>
              }
            />
          </div>

          <div
            className={classes.radioCard}
            data-selected={formData.firstLabour === 'false' || undefined}
          >
            <Radio
              value="false"
              classNames={{
                root: classes.radioRoot,
                body: classes.radioBody,
                radio: classes.radioControl,
                labelWrapper: classes.radioLabelWrapper,
                label: classes.radioLabel,
              }}
              label={
                <div>
                  <span className={classes.radioCardIcon}>
                    <IconSparkles size={20} />
                  </span>
                  <span className={classes.radioCardTitle}>No, I&apos;ve done this before</span>
                  <span className={classes.radioCardDescription}>
                    Subsequent labours can progress faster
                  </span>
                </div>
              }
            />
          </div>
        </div>
      </Radio.Group>

      <Group justify="space-between" className={classes.navigation}>
        <Button
          type="button"
          variant="default"
          onClick={handleBack}
          leftSection={<IconArrowLeft size={16} />}
          radius="xl"
          className={classes.backButton}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          rightSection={<IconArrowRight size={16} />}
          radius="xl"
          className={classes.nextButton}
        >
          Continue
        </Button>
      </Group>
    </div>
  );

  const renderStep3 = () => (
    <div className={classes.stepContainer} key="step3">
      <h3 className={classes.stepTitle} style={{ textAlign: 'center' }}>
        Almost there!
      </h3>
      <Text className={classes.fieldDescription}>
        Would you like to give your labour a name? This is optional, but it can be a nice personal
        touch for you and your loved ones.
      </Text>

      <TextInput
        placeholder="e.g. Baby Fern's arrival"
        value={formData.labourName}
        onChange={(e) => updateFormData('labourName', e.currentTarget.value)}
        rightSection={<IconSparkles size={16} />}
        error={nameError}
        size="md"
        classNames={{
          input: baseClasses.input,
          section: classes.inputSection,
          error: classes.inputError,
        }}
      />

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

      <Group justify="space-between" className={classes.navigation}>
        <Button
          type="button"
          variant="default"
          onClick={handleBack}
          leftSection={<IconArrowLeft size={16} />}
          radius="xl"
          className={classes.backButton}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          leftSection={<IconCheck size={16} />}
          radius="xl"
          className={`${classes.nextButton} ${classes.submitButton}`}
        >
          Continue
        </Button>
      </Group>
    </div>
  );

  return (
    <div className={baseClasses.flexPageColumn}>
      <div className={baseClasses.card}>
        <div className={classes.container}>
          <header className={classes.header}>
            <h1 className={classes.title}>Create your Labour Circle</h1>
            <p className={classes.subtitle}>
              Let&apos;s set up a few things so we can support you through every contraction.
            </p>
          </header>

          <Stepper
            size="sm"
            px={20}
            active={currentStep - 1}
            allowNextStepsSelect={false}
            classNames={{
              root: classes.stepper,
              stepIcon: classes.stepperIcon,
              stepLabel: classes.stepperLabel,
              separator: classes.stepperSeparator,
            }}
          >
            <Stepper.Step label="Due date" />
            <Stepper.Step label="First labour" />
            <Stepper.Step label="Name" />
          </Stepper>

          <div className={classes.formCard}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
        </div>
      </div>
    </div>
  );
}
