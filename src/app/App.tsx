import * as React from 'react'
import { ScrollView, View, Modal } from 'react-native'
import { Observable, Subscription } from 'rxjs'

import { CriticalError, ErrorProps, monitorErrors, errors } from './global'
import { Setup, Main } from './screens'
import { reset as resetConfig } from './logic/config'
import './logic/communication'

type Step = 'config' | 'main'

export interface State {
  criticalError?: ErrorProps
  step: Step
}

export default class App extends React.Component<{}, State> {
  state: State = { step: 'config' }
  sub!: Subscription

  componentDidMount () {
    this.sub = Observable.merge(
      // monitorErrors,
      errors
        .do(e => !e && resetConfig())
        .do(e => e ? this.setState({ criticalError: e }) : this.setState({ criticalError: undefined, step: 'config' }))
        .filter(x => !x)
        .switchMapTo(monitorErrors)
    )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  renderContent = () => {
    switch (this.state.step) {
      case 'config':
        return <Setup onDone={() => this.setState({ step: 'main' })} />
      case 'main':
        return <Main />
    }
  }

  render () {
    // do not render anything else to force fresh mount on re-initialize
    if (this.state.criticalError) {
      return <Modal animationType='fade' >
        <CriticalError {...this.state.criticalError} />
      </Modal>
    }
    return <ScrollView style={{ paddingTop: 24, paddingLeft: 12, paddingRight: 12 }}>
      {this.renderContent()}
      <View style={{ height: 24 }} />
    </ScrollView>
  }
}
