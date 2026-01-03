import { giftAds } from '@base/config/giftAds';
import { Card } from '@components/Cards/Card';
import { Badge, Box, Button, Flex, Image, Space, Text } from '@mantine/core';
import dbhf_main from './ads/dbhf/main.jpg';
import etta_loves_main from './ads/etta-loves/img6-1699887317359.png';
import my1styears_desktop from './ads/my1styears/desktop.jpg';
import my1styears_main from './ads/my1styears/main.webp';
import pure_earth_collection_main from './ads/pureearthcollection/main.jpg';
import thortful_main from './ads/thortful/Thortful_cover_photo.webp';
import zello_main from './ads/zello/main.jpg';
import image from './Gifts.svg';
import baseClasses from '@styles/base.module.css';

const adImages: Record<string, { mobile: string; desktop: string }> = {
  my1styears: { mobile: my1styears_main, desktop: my1styears_desktop },
  'etta-loves': { mobile: etta_loves_main, desktop: etta_loves_main },
  dbhf: { mobile: dbhf_main, desktop: dbhf_main },
  zello: { mobile: zello_main, desktop: zello_main },
  'pure-earth-collection': {
    mobile: pure_earth_collection_main,
    desktop: pure_earth_collection_main,
  },
  thortful: { mobile: thortful_main, desktop: thortful_main },
};

export default function Gifts({ birthingPersonName: motherName }: { birthingPersonName: string }) {
  const description = `Help support ${motherName} with meaningful, practical gifts for the early days of parenthood. From nourishing meals to personal keepsakes, here are a few special ways to show your love, without asking "Do you need anything?"`;

  return (
    <>
      <Card
        title="Thoughtful Gifts for New Parents"
        description={description}
        image={{ src: image, width: 300, height: 356 }}
        mobileImage={{ src: image, width: 300, height: 250 }}
        footer={
          <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.importantText}>
            Some of our links are affiliate links, which help support the app at no extra cost to
            you.
          </Text>
        }
      />
      {giftAds.map((ad, index) => {
        const images = adImages[ad.id];
        const text = ad.text(motherName);

        const headerActions = ad.featured && (
          <Badge color="pink" variant="light">
            Featured
          </Badge>
        );

        return (
          <>
            <Space h="lg" />
            <Card
              key={ad.id}
              title={ad.title}
              description={ad.subtitle}
              headerActions={headerActions || undefined}
            >
              <Flex
                direction={{ base: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' }}
                gap="xl"
                align="center"
                mt="md"
              >
                <Box style={{ flexGrow: 1, width: '100%' }}>
                  <a
                    href={ad.url}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    aria-label={`Visit ${ad.title}`}
                    style={{ display: 'block' }}
                  >
                    <Image
                      visibleFrom="md"
                      src={images.desktop}
                      alt={ad.title}
                      style={{ maxWidth: '250px', width: '100%' }}
                    />
                  </a>
                </Box>
                <Box>
                  <Image
                    hiddenFrom="md"
                    src={images.mobile}
                    alt={ad.title}
                    style={{ maxHeight: '250px', width: '100%', margin: 'auto' }}
                  />
                  <Text mb="sm" mt="md" size="sm" hiddenFrom="sm">
                    {text}
                  </Text>
                  <Text mb="sm" mt="md" size="md" visibleFrom="sm">
                    {text}
                  </Text>
                  <Text fs="italic" mb="xl" size="sm" hiddenFrom="sm">
                    {ad.note}
                  </Text>
                  <Text fs="italic" mb="xl" size="md" visibleFrom="sm">
                    {ad.note}
                  </Text>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <Button
                      component="a"
                      href={ad.url}
                      target="_blank"
                      visibleFrom="md"
                      rel="sponsored noopener noreferrer"
                      variant="light"
                      size="md"
                      radius="xl"
                      style={{ width: '50%' }}
                      aria-label={`Visit ${ad.title}`}
                    >
                      {ad.cta}
                    </Button>
                    <Button
                      component="a"
                      href={ad.url}
                      target="_blank"
                      hiddenFrom="md"
                      rel="sponsored noopener noreferrer"
                      variant="filled"
                      size="md"
                      radius="xl"
                      style={{ width: '100%' }}
                      aria-label={`Visit ${ad.title}`}
                    >
                      {ad.cta}
                    </Button>
                  </div>
                </Box>
              </Flex>
            </Card>
          </>
        );
      })}
    </>
  );
}
