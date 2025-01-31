import * as React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import store from '@/store';
import emitter from '@/emitter';
import { clearNewGroupInvitees } from '@/actions';
import { BLUE, LIGHT_GREY, ORANGE, WHITE } from '@/theme/colors';
import { DEVICE_LARGE, DEVICE_TYPE } from '@/utils/deviceConstants';
import { fontSize } from '@/theme/fonts';
import { connectionsSelector } from '@/utils/connectionsSelector';
import { createSelector } from '@reduxjs/toolkit';
import Spinner from 'react-native-spinkit';
import i18next from 'i18next';
import { NodeApiContext } from '@/components/NodeApiGate';
import { createNewGroup } from '../actions';
import NewGroupCard from './NewGroupCard';

// type State = {
//   creating: boolean,
// };

const ITEM_HEIGHT = DEVICE_LARGE ? 94 : 80;
const ITEM_MARGIN = DEVICE_LARGE ? 11.8 : 6;

const getItemLayout = (data, index) => ({
  length: ITEM_HEIGHT + ITEM_MARGIN,
  offset: (ITEM_HEIGHT + ITEM_MARGIN) * index,
  index,
});

const verifiedConnectionsSelector = createSelector(
  connectionsSelector,
  (connections) => {
    return connections.filter((conn) => conn?.status === 'verified');
  },
);

const creationStateStrings = {
  uploadingGroupPhoto: i18next.t(
    'groups.state.uploadingGroupPhoto',
    'uploading group photo…',
  ),
  creatingGroup: i18next.t('groups.state.creatingGroup', 'creating the group…'),
};

export class NewGroupScreen extends React.Component {
  // make api available through this.context
  static contextType = NodeApiContext;

  constructor(props) {
    super(props);
    this.state = {
      creating: false,
      creationState: 'uploadingGroupPhoto',
    };
  }

  componentDidMount() {
    const { navigation, dispatch } = this.props;
    navigation.addListener('focus', () => {
      emitter.on('creatingGroupChannel', this.updateCreationState);
    });
    navigation.addListener('blur', () => {
      dispatch(clearNewGroupInvitees());
      emitter.off('creatingGroupChannel', this.updateCreationState);
    });
  }

  updateCreationState = (creationState) => {
    this.setState({ creationState });
  };

  cardIsSelected = (card) => {
    const { newGroupInvitees } = this.props;
    return newGroupInvitees.includes(card.id);
  };

  createGroup = async () => {
    try {
      this.setState({ creating: true });
      const api = this.context;
      const { route, navigation } = this.props;
      const { photo, name, isPrimary } = route.params;
      const type = isPrimary ? 'primary' : 'general';
      const res = await store.dispatch(createNewGroup(photo, name, type, api));
      if (res) {
        navigation.navigate('Groups');
      } else {
        this.setState({ creating: false });
      }
    } catch (err) {
      this.setState({ creating: false });
    }
  };

  renderButtonOrSpinner = () => {
    const { t } = this.props;
    const skip = this.props.newGroupInvitees.length < 1;
    return !this.state.creating ? (
      <View style={styles.createGroupButtonContainer}>
        <TouchableOpacity
          testID="createNewGroupBtn"
          onPress={this.createGroup}
          style={
            skip
              ? { ...styles.createGroupButton, ...styles.skipButton }
              : styles.createGroupButton
          }
        >
          <Text style={styles.buttonInnerText}>
            {
              skip
              ? t('createGroup.button.skip')
              : t('createGroup.button.createGroup')
            }
          </Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.loader}>
        <Text style={styles.textInfo}>
          {creationStateStrings[this.state.creationState]}
        </Text>
        <Spinner isVisible={true} size={97} type="Wave" color={BLUE} />
      </View>
    );
  };

  renderConnection = ({ item }) => (
    <NewGroupCard
      {...item}
      selected={this.cardIsSelected(item)}
      groups={true}
      style={styles.connectionCard}
    />
  );

  render() {
    const { t, connections } = this.props;

    return (
      <>
        <View style={styles.orangeTop} />
        <View style={styles.container}>
          <View testID="newGroupScreen" style={styles.mainContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {t('createGroup.label.invitees')}
              </Text>
              <Text style={styles.infoText}>
                {t('createGroup.text.invitees')}
              </Text>
            </View>
            <View style={styles.mainContainer}>
              {connections.length > 0 ? (
                <FlatList
                  style={styles.connectionsContainer}
                  contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}
                  data={connections}
                  keyExtractor={({ id }, index) => id + index}
                  renderItem={this.renderConnection}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  getItemLayout={getItemLayout}
                />
              ) : (
                <View>
                  <Text style={styles.emptyText}>
                    {t('createGroup.text.noConnections')}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {this.renderButtonOrSpinner()}
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  orangeTop: {
    backgroundColor: ORANGE,
    height: DEVICE_LARGE ? 70 : 65,
    width: '100%',
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: WHITE,
    borderTopLeftRadius: 58,

    marginTop: -58,
    zIndex: 10,
    overflow: 'hidden',
  },
  mainContainer: {
    marginTop: 8,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionsContainer: {
    flex: 1,
    width: '96.7%',
    borderTopWidth: 1,
    borderTopColor: LIGHT_GREY,
  },
  emptyText: {
    fontFamily: 'ApexNew-Book',
    fontSize: fontSize[20],
  },
  moreIcon: {
    marginRight: 16,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    backgroundColor: WHITE,
    width: '96.7%',

    marginBottom: DEVICE_TYPE === 'large' ? 11 : 0,
  },
  titleText: {
    fontFamily: 'ApexNew-Book',
    fontSize: fontSize[18],
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.09)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  infoText: {
    fontFamily: 'ApexNew-Book',
    fontSize: fontSize[14],
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'center',
  },
  connectionCard: {
    marginBottom: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GREY,
    width: '100%',
  },
  createGroupButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupButton: {
    backgroundColor: BLUE,
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 13,
    paddingBottom: 12,
    marginBottom: DEVICE_TYPE === 'large' ? 30 : 25,
  },
  skipButton: {
    backgroundColor: BLUE,
  },
  buttonInnerText: {
    fontFamily: 'ApexNew-Medium',
    color: WHITE,
    fontWeight: '600',
    fontSize: fontSize[18],
  },
  textInfo: {
    fontFamily: 'ApexNew-Book',
    fontSize: fontSize[18],
    margin: 18,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
});

export default connect((state) => ({
  newGroupInvitees: state.groups.newGroupInvitees,
  connections: verifiedConnectionsSelector(state),
}))(withTranslation()(NewGroupScreen));
