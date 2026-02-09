import type { BirthPlanData } from '../hooks/useBirthPlanStorage';

export type FieldType = 'text' | 'date' | 'single' | 'multi' | 'freetext';

export interface FormField {
  id: keyof BirthPlanData;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  helpText?: string;
  fields: FormField[];
}

export interface FormStep {
  id: number;
  title: string;
  sections: FormSection[];
}

export const formSteps: FormStep[] = [
  {
    id: 1,
    title: 'Personal Details',
    sections: [
      {
        id: 'personal',
        title: 'Personal Details',
        description: 'Please provide your basic information.',
        fields: [
          { id: 'fullName', label: 'Full name', type: 'text', placeholder: 'Your full name' },
          { id: 'dueDate', label: 'Due date', type: 'date' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Location & Companions',
    sections: [
      {
        id: 'birthLocation',
        title: 'Birth Location',
        description: 'Where would you like to give birth?',
        helpText:
          'You will have a choice about where to have your baby. Your midwife or doctor will be able to tell you what services are available locally and advise you on any issues to do with your health or pregnancy that may affect your choice.',
        fields: [
          {
            id: 'birthLocation',
            label: 'Birth location preference',
            type: 'single',
            options: [
              { value: 'home', label: 'Home' },
              { value: 'midwifery', label: 'Midwifery unit' },
              { value: 'hospital', label: 'Hospital maternity unit' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'birthLocationComments',
            label: 'Comments on birth location and reasons',
            type: 'freetext',
            placeholder: 'Share any thoughts about your birth location preference...',
          },
        ],
      },
      {
        id: 'companionsLabour',
        title: 'Companions During Labour',
        description: 'Would you like someone with you during labour?',
        helpText:
          "Having a companion you can 'lean on' and who can support you during your labour can be helpful. It has been shown to reduce the need for pain relief.",
        fields: [
          {
            id: 'companionsDuringLabour',
            label: 'Companions during labour',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'companionNames',
            label: 'Companion name(s)',
            type: 'freetext',
            placeholder: 'Names of companions...',
          },
        ],
      },
      {
        id: 'companionsForceps',
        title: 'Companions During Forceps or Vacuum Delivery',
        description: 'Would you like someone with you during a forceps or vacuum delivery?',
        helpText:
          "A forceps delivery is where forceps are placed around the baby's head to pull him or her gently from the birth canal. Vacuum delivery, sometimes called ventouse, is when the baby is guided out using a cap fitted to its head by suction.",
        fields: [
          {
            id: 'companionsDuringForceps',
            label: 'Companions during forceps or vacuum delivery',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'dontmind', label: 'I do not mind' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
        ],
      },
      {
        id: 'companionsCaesarean',
        title: 'Companions During Caesarean Section',
        description: 'Would you like someone with you during a caesarean section?',
        helpText:
          'A caesarean section is when the baby is delivered by cutting through the abdomen and into the womb. This will only be performed when it is necessary, but there are situations where this is the safest option for either you or your baby. If your caesarean section is carried out under local anaesthetic and you are awake, your partner or companion may sit with you.',
        fields: [
          {
            id: 'companionsDuringCaesarean',
            label: 'Companions during caesarean section',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'dontmind', label: 'I do not mind' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
        ],
      },
      {
        id: 'birthingEquipment',
        title: 'Birthing Equipment',
        description: 'Would you like to use any birthing equipment?',
        helpText:
          "You may find that items such as wall bars, mats or beanbags help you to change position and remain comfortable during labour. If you're giving birth in a maternity unit, your midwife will be able to tell you if specific items are normally available. However, you may need or prefer to provide some equipment yourself.",
        fields: [
          {
            id: 'birthingEquipment',
            label: 'Use of birthing equipment',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'birthingEquipmentComments',
            label: 'Equipment comments and whether you will provide equipment',
            type: 'freetext',
            placeholder: 'Details about birthing equipment...',
          },
        ],
      },
      {
        id: 'specialFacilities',
        title: 'Special Facilities',
        description: 'Are there any special facilities you would like?',
        helpText:
          "Some units may offer you special facilities such as a birthing pool. Some have special rooms called LDRP rooms (labour, delivery, recovery, postnatal rooms) where you stay in the same room until you leave the hospital, although availability is limited. Your midwife will be able to tell you what's available.",
        fields: [
          {
            id: 'specialFacilities',
            label: 'Special facilities',
            type: 'multi',
            options: [
              { value: 'ldrp', label: 'LDRP room (if available)' },
              { value: 'pool', label: 'Birthing pool (if available)' },
              { value: 'other', label: 'Other special facilities' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'specialFacilitiesComments',
            label: 'Comments on special facilities',
            type: 'freetext',
            placeholder: 'Details about special facilities...',
          },
          {
            id: 'otherLocationComments',
            label: 'Other comments or preferences about location, facilities, or companions',
            type: 'freetext',
            placeholder: 'Any other comments...',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Labour Preferences',
    sections: [
      {
        id: 'monitoring',
        title: 'Monitoring During Labour',
        description: 'Have you discussed monitoring during labour with your midwife or doctor?',
        helpText:
          "Every baby is monitored throughout labour to make sure that it is not in distress. There are different ways of monitoring the baby's heartbeat.",
        fields: [
          {
            id: 'monitoringDiscussed',
            label: 'Monitoring discussed',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes (discussed)' },
              { value: 'no', label: 'No (not discussed)' },
            ],
          },
          {
            id: 'monitoringComments',
            label: 'Monitoring comments',
            type: 'freetext',
            placeholder: 'Your thoughts on monitoring...',
          },
        ],
      },
      {
        id: 'activity',
        title: 'Activity During Labour',
        description: 'Would you like to move around during labour?',
        helpText:
          "Keep active for as long as you feel comfortable. This helps the progress of the birth. Keeping active doesn't mean doing anything strenuous, just moving around normally.",
        fields: [
          {
            id: 'activityDuringLabour',
            label: 'Activity during labour',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'dontmind', label: 'I do not mind' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'activityComments',
            label: 'Movement comments',
            type: 'freetext',
            placeholder: 'Your thoughts on movement during labour...',
          },
        ],
      },
      {
        id: 'positions',
        title: 'Positions for Labour and Birth',
        description: 'What positions would you like to use during labour and birth?',
        helpText:
          'Find the positions you prefer and which will make labour easier for you. Try out various positions at antenatal class or at home to find out which are the most comfortable for you. You can choose as many positions as you want and vary them throughout your labour.',
        fields: [
          {
            id: 'labourPositions',
            label: 'Preferred positions',
            type: 'multi',
            options: [
              { value: 'bed', label: 'In bed, propped by pillows' },
              { value: 'standing', label: 'Standing' },
              { value: 'sitting', label: 'Sitting' },
              { value: 'kneeling', label: 'Kneeling' },
              { value: 'allFours', label: 'Kneeling on all fours' },
              { value: 'squatting', label: 'Squatting' },
              { value: 'side', label: 'Lying on side' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
        ],
      },
      {
        id: 'skinToSkin',
        title: 'Skin-to-Skin Contact After Birth',
        description: 'How would you like your baby given to you after birth?',
        helpText:
          'After the birth you can have your baby lifted straight onto you before the cord is cut so that you can be close to each other immediately. If you prefer, you can ask the midwife to wipe your baby and wrap him or her in a blanket first.',
        fields: [
          {
            id: 'skinToSkin',
            label: 'Skin-to-skin contact',
            type: 'single',
            options: [
              { value: 'immediately', label: 'Delivered straight onto tummy' },
              { value: 'cleaned', label: 'Cleaned before being given' },
              { value: 'dontmind', label: 'I do not mind' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'postBirthPreferences',
            label: 'Immediate post-birth preferences',
            type: 'freetext',
            placeholder: 'Any other immediate post-birth preferences...',
          },
        ],
      },
      {
        id: 'staffInTraining',
        title: 'Staff in Training',
        description: 'Have you discussed staff in training being present?',
        helpText:
          'Midwives, nurses and doctors need to observe women in labour as part of their training. They will always be supervised by a senior health professional.',
        fields: [
          {
            id: 'staffInTraining',
            label: 'Staff in training discussed',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes (discussed)' },
              { value: 'no', label: 'No (not discussed)' },
            ],
          },
          {
            id: 'otherLabourPreferences',
            label: 'Other labour and birth preferences',
            type: 'freetext',
            placeholder: 'Any other labour and birth preferences...',
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'Pain Relief & Medical',
    sections: [
      {
        id: 'painRelief',
        title: 'Pain Relief Options',
        description: 'What pain relief options would you like to consider?',
        helpText:
          'There are many different pain relief options. Some women use a combination of methods. You may find that you want more pain relief than you had planned, or that more effective pain relief may be advised to assist with delivery. You can use a number of different methods at different times.',
        fields: [
          {
            id: 'painRelief',
            label: 'Pain relief options',
            type: 'multi',
            options: [
              { value: 'breathing', label: 'Breathing and relaxation' },
              { value: 'water', label: 'Water immersion' },
              { value: 'massage', label: 'Massage' },
              { value: 'acupuncture', label: 'Acupuncture' },
              { value: 'tens', label: 'TENS' },
              { value: 'entonox', label: 'Gas and air (Entonox)' },
              { value: 'injections', label: 'Pain-relieving injections' },
              { value: 'epidural', label: 'Epidural' },
              { value: 'other', label: 'Other methods' },
              { value: 'none', label: 'Prefer no pain relief' },
            ],
          },
          {
            id: 'painReliefComments',
            label: 'Pain relief preferences',
            type: 'freetext',
            placeholder: 'Your thoughts on pain relief...',
          },
        ],
      },
      {
        id: 'episiotomy',
        title: 'Episiotomy',
        description: 'Have you discussed the possibility of an episiotomy?',
        helpText:
          "An episiotomy is a cut in the perineum (the area between the vagina and anus). This may be necessary if the perineum won't stretch enough and may tear, or if the baby is short of oxygen and needs to be delivered quickly.",
        fields: [
          {
            id: 'episiotomyDiscussed',
            label: 'Episiotomy discussed',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes (discussed)' },
              { value: 'no', label: 'No (not discussed)' },
            ],
          },
          {
            id: 'episiotomyComments',
            label: 'Feelings about possible episiotomy',
            type: 'freetext',
            placeholder: 'Your feelings about episiotomy...',
          },
        ],
      },
      {
        id: 'placenta',
        title: 'Placenta Delivery',
        description: 'Have you discussed placenta delivery?',
        helpText:
          'After your baby is born your midwife will offer you an injection in your thigh. This contains the drug syntometrine or syntocinon which helps the womb contract and can prevent the heavy bleeding that some women may experience without it.',
        fields: [
          {
            id: 'placentaDiscussed',
            label: 'Placenta delivery discussed',
            type: 'single',
            options: [
              { value: 'yes', label: 'Yes (discussed)' },
              { value: 'no', label: 'No (not discussed)' },
            ],
          },
          {
            id: 'placentaComments',
            label: 'Preferences about placenta delivery',
            type: 'freetext',
            placeholder: 'Your preferences about placenta delivery...',
          },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'After Birth',
    sections: [
      {
        id: 'feeding',
        title: 'Feeding Your Baby',
        description: 'How would you like to feed your baby?',
        helpText:
          'Breast milk is the best form of nutrition for babies as it provides all the nutrients a baby needs and has lasting benefits for the health of your child. Infant formula milk can be used as an alternative to breast milk.',
        fields: [
          {
            id: 'feedingChoice',
            label: 'Feeding choice',
            type: 'single',
            options: [
              { value: 'breastfeed', label: 'Breastfeed' },
              { value: 'bottle', label: 'Bottle feed' },
              { value: 'combination', label: 'Combination feeding' },
              { value: 'unsure', label: 'Not sure yet' },
            ],
          },
          {
            id: 'feedingComments',
            label: 'Feeding comments',
            type: 'freetext',
            placeholder: 'Your thoughts on feeding...',
          },
        ],
      },
      {
        id: 'vitaminK',
        title: 'Vitamin K',
        description: 'Vitamin K helps prevent a rare bleeding disorder in newborns.',
        helpText:
          'Vitamin K is needed to make the blood clot properly. Some newborn babies have too little vitamin K so it may be suggested that your baby be given vitamin K either by injection or by mouth.',
        fields: [
          {
            id: 'vitaminKConsent',
            label: 'Vitamin K consent',
            type: 'single',
            options: [
              { value: 'yes', label: 'Consent given' },
              { value: 'no', label: 'Consent not given' },
            ],
          },
          {
            id: 'otherPostBirthPreferences',
            label: 'Other immediate post-birth preferences',
            type: 'freetext',
            placeholder: 'Any other post-birth preferences...',
          },
        ],
      },
    ],
  },
  {
    id: 6,
    title: 'Special Requirements',
    sections: [
      {
        id: 'specialRequirements',
        title: 'Special Requirements',
        description: 'Do you have any special requirements?',
        helpText:
          'Please tick any that apply to you. You can fill in more details in the box below.',
        fields: [
          {
            id: 'specialRequirements',
            label: 'Special requirements',
            type: 'multi',
            options: [
              { value: 'interpreter', label: 'Interpreter needed (non-native English)' },
              { value: 'signLanguage', label: 'Sign language interpreter' },
              { value: 'dietary', label: 'Special dietary requirements' },
              { value: 'specialNeeds', label: 'Special needs (self or partner)' },
              { value: 'religious', label: 'Religious customs' },
            ],
          },
          {
            id: 'specialRequirementsDetails',
            label: 'Details of special requirements',
            type: 'freetext',
            placeholder: 'Please provide details of any special requirements...',
          },
        ],
      },
      {
        id: 'generalComments',
        title: 'General Comments',
        description: 'Is there anything else you would like to add?',
        fields: [
          {
            id: 'generalComments',
            label: 'General comments',
            type: 'freetext',
            placeholder: 'Any other comments or preferences...',
          },
        ],
      },
    ],
  },
];
