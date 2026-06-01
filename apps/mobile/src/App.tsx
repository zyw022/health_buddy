// ─────────────────────────────────────────────
// apps/mobile/src/App.tsx — React Native Expo 根组件
//
// TODO(phase-2): 实现启动屏 → 权限引导 → 主界面（仅简单状态提示）。
// TODO(phase-2): 初始化 LowFrictionMobileCollector，绑定同一 userId。
// TODO(phase-2): 用户扫码或输入 code 与桌面端绑定账号。
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Buddy</Text>
      <Text style={styles.subtitle}>手机端信号采集</Text>
      {/* TODO(phase-2): 实现主界面：绑定状态、采集开关、上次同步时间 */}
      <Text style={styles.stub}>TODO(phase-2): 功能开发中</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginBottom: 32,
  },
  stub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});
