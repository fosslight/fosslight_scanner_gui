import React, { FC } from 'react';

interface ISVGIconProps {
  size: number;
}

export const ModeScanIcon: React.FC = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="scan">
      <path
        id="Vector"
        d="M0.533447 5.3332V2.66654C0.533447 1.48833 1.48857 0.533203 2.66678 0.533203H5.33345M10.6668 0.533203H13.3334C14.5117 0.533203 15.4668 1.48833 15.4668 2.66654V5.3332M0.533447 10.6665V13.3332C0.533447 14.5114 1.48857 15.4665 2.66678 15.4665H5.33345M15.4668 10.6665V13.3332C15.4668 14.5114 14.5117 15.4665 13.3334 15.4665H10.6668M2.13345 7.99987H13.8668"
        stroke="#A1A9B0"
        stroke-width="1.06667"
      />
    </g>
  </svg>
);

export const ModeCompareIcon: React.FC = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="compare">
      <path
        id-="Vector"
        d="M1.6001 11.7336V6.93356C1.6001 5.75535 2.55522 4.80023 3.73343 4.80023C4.91164 4.80023 5.86676 5.75535 5.86676 6.93356V11.7336M1.6001 9.06689H5.86676M12.8001 8.00023H10.1334M12.8001 8.00023C13.6838 8.00023 14.4001 7.28388 14.4001 6.40023C14.4001 5.51657 13.6838 4.80023 12.8001 4.80023H10.1334V8.00023M12.8001 8.00023C13.6838 8.00023 14.4001 8.71657 14.4001 9.60023C14.4001 10.4839 13.6838 11.2002 12.8001 11.2002H10.1334V8.00023M8.0001 1.06689V14.9336"
        stroke="#A50034"
        stroke-width="1.06667"
      />
    </g>
  </svg>
);

export const FileEditIcon: React.FC = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="edit">
      <path
        id-="Vector"
        d="M9.44373 4.42281C9.23545 4.21453 8.89776 4.21453 8.68948 4.42281L4.2666 8.84569V11.1999C4.2666 11.4945 4.50538 11.7333 4.79993 11.7333H7.15418L11.5771 7.31039C11.7853 7.10211 11.7853 6.76442 11.5771 6.55614L9.44373 4.42281Z"
        fill="#626B74"
      />
    </g>
  </svg>
);

export const ModifyModalIcon: React.FC = (props) => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="edit">
      <path
        id-="Vector"
        d="M9.44373 4.42281C9.23545 4.21453 8.89776 4.21453 8.68948 4.42281L4.2666 8.84569V11.1999C4.2666 11.4945 4.50538 11.7333 4.79993 11.7333H7.15418L11.5771 7.31039C11.7853 7.10211 11.7853 6.76442 11.5771 6.55614L9.44373 4.42281Z"
        fill="white"
      />
    </g>
  </svg>
);

export const ExclamationIcon: React.FC = (props) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="exclaim">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7 11V1H8V11H7ZM8 13V14.01H7V13H8Z"
        fill="white"
      />
    </g>
  </svg>
);

export const QuestionIcon: React.FC = (props) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="question">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M3.67218 1.62075C4.70993 0.583002 6.11742 0 7.58502 0H7.79183C10.122 0 12 1.92493 12 4.24297C12 5.7995 11.1217 7.2482 9.72364 7.94721C8.6673 8.47538 8.00004 9.55504 8.00004 10.7361V12H7.00004V10.7361C7.00004 9.17627 7.88131 7.75035 9.27643 7.05279C10.3299 6.52607 11 5.42726 11 4.24297C11 2.46504 9.55763 1 7.79183 1H7.58502C6.38264 1 5.2295 1.47765 4.37929 2.32786L3.85359 2.85355L3.14648 2.14645L3.67218 1.62075ZM8.00004 15H7.00004V14H8.00004V15Z"
        fill="white"
      />
    </g>
  </svg>
);

export const FileDeleteIcon: FC = () => (
  <img src="/src/assets/icons/file-delete.svg" alt="delete" />
);
export const FossLogo: React.FC = (props) => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="fosslogo">
      <path
        id="Vector_2"
        opacity="0.8"
        d="M1.30469 1.41016L6.85273 14.5897H14.6919L1.30469 1.41016Z"
        fill="#A50034"
      />
      <path
        id="Vector_3"
        opacity="0.7"
        d="M1.30469 1.41016L6.85273 14.5897L14.6955 9.44163L1.30469 1.41016Z"
        fill="#A50034"
      />
    </g>
  </svg>
);

export const CheckOnIcon: React.FC = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="tick-circle">
      <path
        id="Vector"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12ZM11.3149 17.137L18.2247 8.49971L16.9753 7.5002L11.0852 14.8629L6.91219 11.3854L5.88789 12.6145L11.3149 17.137Z"
        fill="#A50034"
      />
    </g>
  </svg>
);

export const CheckOffIcon: React.FC = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="tick-circle">
      <path
        id="Vector"
        d="M6.40029 12.0003L11.2003 16.0003L17.6003 8.00029M12.0003 23.2003C5.8147 23.2003 0.800293 18.1859 0.800293 12.0003C0.800293 5.8147 5.8147 0.800293 12.0003 0.800293C18.1859 0.800293 23.2003 5.8147 23.2003 12.0003C23.2003 18.1859 18.1859 23.2003 12.0003 23.2003Z"
        stroke="#BDC2C7"
        stroke-width="1.33333"
      />
    </g>
  </svg>
);
