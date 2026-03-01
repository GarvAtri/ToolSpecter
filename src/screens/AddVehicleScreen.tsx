import { Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function AddVehicleScreen({ navigation }: any) {
  const [name,   setName]   = useState('');
  const [model,  setModel]  = useState('');
  const [year,   setYear]   = useState('');
  const [serial, setSerial] = useState('');
  const [glbUri, setGlbUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickGlb = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['model/gltf-binary', 'application/octet-stream', '*/*'] });
    if (!res.canceled && res.assets[0]) {
      setGlbUri(res.assets[0].uri);
      Alert.alert('GLB selected', res.assets[0].name);
    }
  };

  const handleSave = async () => {
    if (!name || !model || !year) return Alert.alert('Fill in all required fields');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name',  name);
      formData.append('model', model);
      formData.append('year',  year);
      if (serial) formData.append('serialNumber', serial);
      if (glbUri) {
        formData.append('glbModel', { uri: glbUri, name: 'model.glb', type: 'model/gltf-binary' } as any);
      }
      await apiClient.post('/vehicles', formData);
      navigation.replace('Fleet');
    } catch (e) {
      Alert.alert('Save failed', String(e));
    } finally {
      setSaving(false);
    }
  };

  const inp = { backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 13, color: '#fff', fontFamily: FONT, fontSize: 14, marginBottom: 12 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: BORDER }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 16, color: GRAY }}>← BACK</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '700', color: '#fff' }}>ADD VEHICLE</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ fontFamily: FONT_BOLD, fontSize: 10, color: '#2a2a2a', letterSpacing: 4, marginBottom: 14 }}>VEHICLE DETAILS</Text>
        <TextInput style={inp} placeholder="Vehicle name *" placeholderTextColor={GRAY} value={name} onChangeText={setName} />
        <TextInput style={inp} placeholder="Model (e.g. 320 GC) *" placeholderTextColor={GRAY} value={model} onChangeText={setModel} />
        <TextInput style={inp} placeholder="Year *" placeholderTextColor={GRAY} value={year} onChangeText={setYear} keyboardType="numeric" />
        <TextInput style={inp} placeholder="Serial number (optional)" placeholderTextColor={GRAY} value={serial} onChangeText={setSerial} />

        <TouchableOpacity style={{ backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: glbUri ? CAT_YELLOW : BORDER, borderRadius: 6, padding: 16, alignItems: 'center', marginBottom: 24 }} onPress={pickGlb}>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 16, color: glbUri ? CAT_YELLOW : GRAY }}>
            {glbUri ? '✓ GLB Model Selected' : '📦 Upload GLB 3D Model (optional)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ backgroundColor: CAT_YELLOW, borderRadius: 5, padding: 17, alignItems: 'center' }} onPress={handleSave} disabled={saving}>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 20, fontWeight: '800', color: BG, letterSpacing: 2 }}>
            {saving ? 'SAVING…' : 'SAVE VEHICLE →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
