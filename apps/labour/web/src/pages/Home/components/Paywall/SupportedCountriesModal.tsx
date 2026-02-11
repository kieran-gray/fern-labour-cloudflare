import { useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { CloseButton, Group, List, Modal, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import supportedCountries from '../../../../config/supported-countries.json';
import baseClasses from '@styles/base.module.css';
import classes from '@styles/modal.module.css';

interface SupportedCountriesModalProps {
  opened: boolean;
  onClose: () => void;
}

export const SupportedCountriesModal = ({ opened, onClose }: SupportedCountriesModalProps) => {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    return supportedCountries
      .filter((country) => country.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Supported Countries"
      size="lg"
      classNames={{
        content: classes.modalRoot,
        header: classes.modalHeader,
        title: classes.modalTitle,
        body: classes.modalBody,
        close: classes.closeButton,
      }}
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      centered
    >
      <Stack gap="md">
        <TextInput
          placeholder="Search countries..."
          leftSection={<IconSearch size={16} color="var(--mantine-color-gray-5)" />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          rightSection={
            <CloseButton
              color="var(--mantine-color-gray-5)"
              aria-label="Clear input"
              onClick={() => setSearch('')}
              style={{ display: search ? undefined : 'none' }}
            />
          }
          classNames={{ input: baseClasses.input }}
          styles={{ input: { paddingLeft: 40 } }}
        />
        <ScrollArea h={300} offsetScrollbars type="auto">
          <List spacing="xs" size="sm" center listStyleType="none">
            {filteredCountries.map((country) => (
              <List.Item
                key={country.code}
                p="xs"
                style={{ borderRadius: 'var(--mantine-radius-sm)' }}
              >
                <Group>
                  <Text size="xl">{getFlagEmoji(country.code)}</Text>
                  <Text
                    className={classes.modalText}
                    style={{ fontSize: 'var(--mantine-font-size-md)' }}
                  >
                    {country.name}
                  </Text>
                  <Text
                    className={classes.modalText}
                    style={{ fontSize: 'var(--mantine-font-size-xs)' }}
                  >
                    ({country.dialCode})
                  </Text>
                </Group>
              </List.Item>
            ))}
            {filteredCountries.length === 0 && (
              <Text c="dimmed" ta="center" mt="md" className={classes.modalText}>
                No countries found
              </Text>
            )}
          </List>
        </ScrollArea>
      </Stack>
    </Modal>
  );
};
