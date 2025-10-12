// AdminCustomComponents/PrintPdfButton.jsx
import React from 'react';
import { Button } from '@adminjs/design-system';

const PrintPdfButton = (props) => {
  const { record } = props;
  console.log("records in generate reciept is : " , record)

  if (!record?.params?.latestBillUrl) {
    return <div> No Bill Present For This Property</div>;
  }

  const handlePrint = () => {
    const win = window.open(record.params.latestBillUrl, '_blank');
    win?.addEventListener('load', () => {
      win.print();
    });
  };

  return (
   <div>
     <Button
      variant="primary"
      onClick={handlePrint}
    >
      🖨 Print Tax Bill
    </Button>
   </div>
  );
};

export default PrintPdfButton;
