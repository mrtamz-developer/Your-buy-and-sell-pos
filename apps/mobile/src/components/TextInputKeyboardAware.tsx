import React from 'react';
import { TextInput } from 'react-native';

export default function TextInputKeyboardAware(props: any) {
  return <TextInput keyboardType="numeric" {...props} style={[{ borderWidth:1, padding:8, marginTop:8 }, props.style]} />;
}
