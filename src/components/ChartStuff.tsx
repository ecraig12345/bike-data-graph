import React from 'react';
import dynamic from 'next/dynamic';
import { useChartData } from '../utils/chart/useChartData';
import { useChartProps } from '../utils/chart/useChartProps';
import FieldPicker from './FieldPicker';

const LineChart = dynamic(
  () => import('./LineChart'),
  // a dep of the zoom plugin tries to access window on import
  { ssr: false }
);

export type ChartStuffProps = {
  filePath: string;
};

const ChartStuff: React.FunctionComponent<ChartStuffProps> = (props) => {
  const { filePath } = props;

  const { data: rawData, fields: allFields, error } = useChartData(filePath);

  const [timeField, setTimeField] = React.useState<string>();
  const [fields, setFields] = React.useState<string[]>();

  React.useEffect(() => {
    if (allFields) {
      setTimeField(allFields.find((f) => f.toLowerCase() === 'timestamp'));
      setFields(allFields.filter((f) => f.toLowerCase().startsWith('power')));
    }
  }, [allFields]);

  const { data, options } = useChartProps(filePath, rawData, timeField, fields);

  if (error || !(data && fields?.length && timeField)) {
    return <>{error}</>;
  }

  return (
    <>
      {data && <LineChart options={options} data={data} />}
      {allFields && (
        <FieldPicker
          timeField={timeField}
          setTimeField={setTimeField}
          allFields={allFields}
          fields={fields}
          setFields={setFields}
        />
      )}
    </>
  );
};

export default ChartStuff;
