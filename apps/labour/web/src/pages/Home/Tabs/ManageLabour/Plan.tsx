import { LabourReadModel } from '@base/clients/labour_service';
import { AppMode, useLabourSession } from '@base/contexts';
import { useLabourClient, usePlanLabour, useUpdateLabourPlan } from '@base/hooks';
import { validateLabourName } from '@lib';
import { IconArrowRight, IconCalendar, IconPencil, IconUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Button, Group, Image, Radio, Text, TextInput, Title } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import image from './plan.svg';
import classes from './Plan.module.css';
import baseClasses from '@styles/base.module.css';

export default function Plan({ labour }: { labour: LabourReadModel | undefined }) {
  const navigate = useNavigate();
  const { setMode, setLabourId } = useLabourSession();
  const client = useLabourClient();
  const planLabourMutation = usePlanLabour(client);
  const updateLabourMutation = useUpdateLabourPlan(client);

  const mutation = labour ? updateLabourMutation : planLabourMutation;

  const icon =
    labour === undefined ? (
      <IconArrowRight size={18} stroke={1.5} />
    ) : (
      <IconUpload size={18} stroke={1.5} />
    );

  const boolToString = (val: boolean) => {
    return val ? 'true' : 'false';
  };

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dueDate: labour ? new Date(labour.due_date) : new Date(),
      firstLabour: labour ? boolToString(labour.first_labour) : 'true',
      labourName: labour ? labour.labour_name : '',
    },
    validate: { labourName: (value) => validateLabourName(value) },
  });

  const handlePlanLabour = (values: typeof form.values) => {
    const firstLabour = values.firstLabour === 'true';
    const dueDate = values.dueDate;
    const labourName = values.labourName || undefined;

    if (labour) {
      updateLabourMutation.mutate({
        labourId: labour.labour_id,
        firstLabour,
        dueDate,
        labourName,
      });
    } else {
      planLabourMutation.mutate(
        {
          firstLabour,
          dueDate,
          labourName,
        },
        {
          onSuccess: (data) => {
            setMode(AppMode.Birth);
            setLabourId(data.labour_id);
            setTimeout(() => navigate('/'), 100);
          },
        }
      );
    }
  };

  const title = 'Plan your upcoming labour';
  const description =
    'Add some basic details about your upcoming labour to help us provide you with the best service.';

  return (
    <form onSubmit={form.onSubmit((values) => handlePlanLabour(values))}>
      <div className={classes.inner} style={{ padding: 0, marginBottom: '25px' }}>
        <div className={classes.content}>
          <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
            {title}
          </Title>
          <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={10}>
            {description}
          </Text>
          <div className={classes.imageFlexRow}>
            <Image className={classes.smallImage} src={image} />
          </div>
          <Group mt={30}>
            <div className={classes.controls}>
              <div className={classes.flexRow}>
                <DatePickerInput
                  placeholder="Due date"
                  rightSection={<IconCalendar size={18} stroke={1.5} />}
                  valueFormat="DD/MM/YYYY"
                  label="Estimated due date"
                  description="Remember, your due date is only an estimate (only 4% of women give birth on theirs)"
                  radius="lg"
                  size="md"
                  required
                  key={form.key('dueDate')}
                  {...form.getInputProps('dueDate')}
                  withAsterisk
                  styles={{
                    weekday: {
                      color: 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-4))',
                    },
                  }}
                  classNames={{
                    description: baseClasses.description,
                    input: baseClasses.input,
                    section: baseClasses.section,
                    levelsGroup: baseClasses.selectDropdown,
                  }}
                />
                <Radio.Group
                  name="firstLabour"
                  key={form.key('firstLabour')}
                  label="Is this your first labour?"
                  description="We use this information to make sure you get to hospital on time"
                  size="md"
                  withAsterisk
                  {...form.getInputProps('firstLabour')}
                  mt="20px"
                  classNames={{ description: baseClasses.description }}
                >
                  <Group mt="xs">
                    <Radio value="true" label="Yes" />
                    <Radio value="false" label="No" />
                  </Group>
                </Radio.Group>
                <TextInput
                  rightSection={<IconPencil size={18} stroke={1.5} />}
                  key={form.key('labourName')}
                  label="Would you like to give your labour a name?"
                  description="You don't need to, but if you do we will use it when we send notifications to your subscribers"
                  placeholder="Baby Fern's birth"
                  size="md"
                  radius="lg"
                  {...form.getInputProps('labourName')}
                  mt="20px"
                  classNames={{
                    description: baseClasses.description,
                    input: baseClasses.input,
                    section: baseClasses.section,
                  }}
                />
              </div>
            </div>
          </Group>
        </div>
        <Image src={image} className={classes.image} />
      </div>
      {(labour === undefined && (
        <div
          className={classes.submitRow}
          style={{ justifyContent: 'flex-end', marginTop: '15px' }}
        >
          <Button
            rightSection={icon}
            variant="filled"
            radius="xl"
            size="md"
            h={48}
            className={classes.submitButton}
            styles={{ section: { marginLeft: 22 } }}
            type="submit"
            loading={mutation.isPending}
          >
            Finish Planning Labour
          </Button>
        </div>
      )) || (
        <div className={classes.submitRow} style={{ justifyContent: 'space-between' }}>
          <Button
            leftSection={icon}
            variant="light"
            radius="xl"
            size="md"
            h={48}
            className={classes.submitButton}
            styles={{ section: { marginRight: 22 } }}
            type="submit"
            loading={mutation.isPending}
          >
            Update labour plan
          </Button>
          <Button
            rightSection={<IconArrowRight size={18} stroke={1.5} />}
            variant="filled"
            radius="xl"
            size="md"
            h={48}
            className={classes.backButton}
            styles={{ section: { marginLeft: 22 } }}
            onClick={() => navigate('/')}
          >
            Go to app
          </Button>
        </div>
      )}
    </form>
  );
}
