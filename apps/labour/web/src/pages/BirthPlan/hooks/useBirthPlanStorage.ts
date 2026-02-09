import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'birth-plan-draft';

export interface BirthPlanData {
  // Section 1 - Personal Details
  fullName: string;
  dueDate: string;

  // Section 2 - Birth Location
  birthLocation: string;
  birthLocationComments: string;

  // Section 3 - Companions During Labour
  companionsDuringLabour: string;
  companionNames: string;

  // Section 4 - Companions During Forceps/Vacuum
  companionsDuringForceps: string;

  // Section 5 - Companions During Caesarean
  companionsDuringCaesarean: string;

  // Section 6 - Birthing Equipment
  birthingEquipment: string;
  birthingEquipmentComments: string;

  // Section 7 - Special Facilities
  specialFacilities: string[];
  specialFacilitiesComments: string;
  otherLocationComments: string;

  // Section 8 - Monitoring During Labour
  monitoringDiscussed: string;
  monitoringComments: string;

  // Section 9 - Activity During Labour
  activityDuringLabour: string;
  activityComments: string;

  // Section 10 - Positions for Labour and Birth
  labourPositions: string[];

  // Section 11 - Skin-to-Skin Contact
  skinToSkin: string;
  postBirthPreferences: string;

  // Section 12 - Staff in Training
  staffInTraining: string;
  otherLabourPreferences: string;

  // Section 13 - Pain Relief Options
  painRelief: string[];
  painReliefComments: string;

  // Section 14 - Episiotomy
  episiotomyDiscussed: string;
  episiotomyComments: string;

  // Section 15 - Placenta Delivery
  placentaDiscussed: string;
  placentaComments: string;

  // Section 16 - Feeding Your Baby
  feedingChoice: string;
  feedingComments: string;

  // Section 17 - Vitamin K
  vitaminKConsent: string;
  otherPostBirthPreferences: string;

  // Section 18 - Special Requirements
  specialRequirements: string[];
  specialRequirementsDetails: string;

  // Section 19 - General Comments
  generalComments: string;
}

export function getEmptyBirthPlan(): BirthPlanData {
  return {
    fullName: '',
    dueDate: '',
    birthLocation: '',
    birthLocationComments: '',
    companionsDuringLabour: '',
    companionNames: '',
    companionsDuringForceps: '',
    companionsDuringCaesarean: '',
    birthingEquipment: '',
    birthingEquipmentComments: '',
    specialFacilities: [],
    specialFacilitiesComments: '',
    otherLocationComments: '',
    monitoringDiscussed: '',
    monitoringComments: '',
    activityDuringLabour: '',
    activityComments: '',
    labourPositions: [],
    skinToSkin: '',
    postBirthPreferences: '',
    staffInTraining: '',
    otherLabourPreferences: '',
    painRelief: [],
    painReliefComments: '',
    episiotomyDiscussed: '',
    episiotomyComments: '',
    placentaDiscussed: '',
    placentaComments: '',
    feedingChoice: '',
    feedingComments: '',
    vitaminKConsent: '',
    otherPostBirthPreferences: '',
    specialRequirements: [],
    specialRequirementsDetails: '',
    generalComments: '',
  };
}

export function useBirthPlanStorage() {
  const [data, setData] = useState<BirthPlanData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...getEmptyBirthPlan(), ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse errors
    }
    return getEmptyBirthPlan();
  });

  // Autosave on data change
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // Ignore storage errors
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data]);

  const updateField = useCallback(
    <K extends keyof BirthPlanData>(field: K, value: BirthPlanData[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(getEmptyBirthPlan());
  }, []);

  return { data, updateField, clearAll };
}
