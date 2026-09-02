import React from 'react';

type Props = { navigation: any };

/**
 * Learn was promoted to the Path tab (IA reorg, Phase 1) — the catalog now
 * lives in PathScreen. This stack route stays as a redirect so old deep links
 * ("Learn") keep working: navigating here lands on the Path tab.
 */
export const LearnScreen: React.FC<Props> = ({ navigation }) => {
  React.useEffect(() => {
    navigation.navigate('MainTabs', { screen: 'Path' });
  }, [navigation]);
  return null;
};
