from pathlib import Path

TARGET = Path("frontend/components/farm/FarmDataScreens.tsx")
source = TARGET.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count == 0 and new in source:
        print(f"skip {label}: already applied")
        return
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly 1 match, found {count}")
    source = source.replace(old, new, 1)
    print(f"applied {label}")


replace_once(
    '  const [severity, setSeverity] = useState<SymptomSeverity | undefined>();\n  const [sheet, setSheet] = useState<SheetKind | null>(null);',
    '  const [severity, setSeverity] = useState<SymptomSeverity | undefined>();\n  const [isEditingSymptom, setIsEditingSymptom] = useState(true);\n  const [sheet, setSheet] = useState<SheetKind | null>(null);',
    "symptom editing state",
)

replace_once(
    '      setSeverity(undefined);\n      setLocalMeasurements(undefined);\n      setAttemptedSubmit(false);',
    '      setSeverity(undefined);\n      setIsEditingSymptom(true);\n      setLocalMeasurements(undefined);\n      setAttemptedSubmit(false);',
    "reset symptom editing state after submit",
)

replace_once(
    '          {severity && (!shouldShowSymptomDescription || symptomDescription) ? (',
    '          {severity &&\n          (!shouldShowSymptomDescription || symptomDescription) &&\n          !isEditingSymptom ? (',
    "keep symptom editor mounted while typing",
)

replace_once(
    '                  onPress={() => setSeverity(undefined)}\n                >\n                  <Text style={styles.symptomSummaryText}>',
    '                  onPress={() => setIsEditingSymptom(true)}\n                >\n                  <Text style={styles.symptomSummaryText}>',
    "edit description from summary",
)

replace_once(
    '                  onPress={() => setSeverity(undefined)}\n                >\n                  <Text style={styles.severityPillText}>',
    '                  onPress={() => setIsEditingSymptom(true)}\n                >\n                  <Text style={styles.severityPillText}>',
    "edit severity from summary",
)

replace_once(
    '''                    onPress={() => {
                      setSeverity(item.value);
                      if (item.value === "Khỏe mạnh") {
                        setSymptomDescription("");
                      }
                    }}''',
    '''                    onPress={() => {
                      setSeverity(item.value);
                      if (item.value === "Khỏe mạnh") {
                        setSymptomDescription("");
                        setIsEditingSymptom(false);
                      } else {
                        setIsEditingSymptom(true);
                      }
                    }}''',
    "keep symptom editor active after severity changes",
)

replace_once(
    '''                    <TextInput
                      multiline
                      maxLength={300}
                      value={symptomDescription}
                      onChangeText={setSymptomDescription}
                      placeholder="Nhập triệu chứng quan sát được..."''',
    '''                    <TextInput
                      testID="symptom-description-input"
                      multiline
                      maxLength={300}
                      value={symptomDescription}
                      onChangeText={(value) => {
                        setSymptomDescription(value);
                        setIsEditingSymptom(true);
                      }}
                      onBlur={() => {
                        if (symptomDescription.trim()) {
                          setIsEditingSymptom(false);
                        }
                      }}
                      placeholder="Nhập triệu chứng quan sát được..."''',
    "make symptom text input stable",
)

replace_once(
    '''            onPress={() => {
                props.onPlot(undefined);
              }}
            >
              <Text style={styles.sheetOutlineActionText}>Không chọn mã</Text>''',
    '''            testID="plot-clear-selection"
              onPress={() => {
                props.onPlot(undefined);
                close();
              }}
            >
              <Text style={styles.sheetOutlineActionText}>Không chọn mã</Text>''',
    "close plot drawer only for no-selection action",
)

replace_once(
    '''                  key={plot.id}
                  style={styles.optionRow}
                  onPress={() => {''',
    '''                  key={plot.id}
                  testID={`plot-option-${plot.code}`}
                  style={styles.optionRow}
                  onPress={() => {''',
    "plot option test id",
)

replace_once(
    '''                    key={crop.id}
                    style={[''',
    '''                    key={crop.id}
                    testID={`crop-option-${crop.id}`}
                    style={[''',
    "crop option test id",
)

replace_once(
    '''                key={stage.id}
                style={[''',
    '''                key={stage.id}
                testID={`stage-option-${stage.id}`}
                style={[''',
    "growth-stage option test id",
)

replace_once(
    '''            onPress={() => setSheet("crop")}
            icon={''',
    '''            onPress={() => setSheet("crop")}
            testID="crop-type-input"
            icon={''',
    "crop selector test id",
)

replace_once(
    '''            onPress={() => setSheet("stage")}
            icon={''',
    '''            onPress={() => setSheet("stage")}
            testID="growth-stage-input"
            icon={''',
    "growth-stage selector test id",
)

TARGET.write_text(source, encoding="utf-8")
print(f"updated {TARGET}")
