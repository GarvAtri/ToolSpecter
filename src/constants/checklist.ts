import { ChecklistItem } from '../../App';

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id:'engine_oil',   section:'Engine',        label:'Engine Oil Level' },
  { id:'coolant',      section:'Engine',        label:'Coolant Level' },
  { id:'air_filter',   section:'Engine',        label:'Air Filter Condition' },
  { id:'belts',        section:'Engine',        label:'Drive Belts & Hoses' },
  { id:'tracks',       section:'Undercarriage', label:'Track Wear & Tension' },
  { id:'rollers',      section:'Undercarriage', label:'Rollers & Idlers' },
  { id:'sprocket',     section:'Undercarriage', label:'Sprocket Condition' },
  { id:'hyd_fluid',    section:'Hydraulics',    label:'Hydraulic Fluid Level' },
  { id:'hoses',        section:'Hydraulics',    label:'Hydraulic Hoses & Fittings' },
  { id:'cylinders',    section:'Hydraulics',    label:'Cylinder Seals' },
  { id:'bucket_teeth', section:'Attachments',   label:'Bucket Teeth & Cutting Edge' },
  { id:'bucket_pins',  section:'Attachments',   label:'Boom & Stick Pins' },
  { id:'lights',       section:'Electrical',    label:'Lights & Signals' },
  { id:'battery',      section:'Electrical',    label:'Battery & Terminals' },
  { id:'cab_glass',    section:'Cab',           label:'Cab Glass & Mirrors' },
  { id:'seat_belt',    section:'Cab',           label:'Seat Belt & Safety Guards' },
];