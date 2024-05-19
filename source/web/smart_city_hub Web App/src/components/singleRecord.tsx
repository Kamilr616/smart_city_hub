import { Data } from "./charts"

export default function SingleRecord({ record }: { record: Data | undefined }) {

    return (<div>
        <p>Cisnienie {record?.pressure}</p>
        <p>Temperatura {record?.temperature}</p>
        <p>Wilgotność {record?.humidity}</p>
        <p>Data {record?.readingDate}</p>
    </div>)
}
