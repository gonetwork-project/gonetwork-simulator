import * as React from 'react'
import { Modal, YellowBox } from 'react-native'
import { Observable, Subscription } from 'rxjs'
import { Root } from 'native-base'

import { CriticalError, ErrorProps, errors } from './global'
import { Setup, Main, EventsVis, WebVis } from './screens'
import * as setup from './logic/setup'
import { SessionId } from '../protocol'

// Side-Effects
// todo: it is not ideal as, in theory, it may fail
import './logic/init'
YellowBox.ignoreWarnings(['Warning: Overriding previous layout', 'Attempted to invoke'])

type Step = 'setup' | 'main' | 'events-vis' | 'web-vis'

export interface State {
  criticalError?: ErrorProps
  sessionId?: SessionId
  step: Step
}

export default class App extends React.Component<{}, State> {
  state: State = { step: 'setup' }
  sub!: Subscription

  componentDidMount () {
    this.sub = Observable.merge(
      errors
        .do(e => e ? this.setState({ criticalError: e }) : this.setState({ criticalError: undefined, step: 'setup' }))
        .filter(x => !x),
      setup.session
        .distinctUntilChanged()
        .do(s => this.setState({
          step: s ? 'main' : 'setup' // FIXME
        }))
    )
      .subscribe()
  }

  componentWillUnmount () {
    this.sub && this.sub.unsubscribe()
  }

  renderContent = () => {
    switch (this.state.step) {
      case 'setup':
        return <Setup onDone={() => this.setState({ step: 'main' })} />
      case 'main':
        return <Main />
      case 'events-vis':
        return <EventsVis />
      case 'web-vis':
        return <WebVis />
    }
  }

  render () {
    // do not render anything else to force fresh mount on re-initialize
    if (this.state.criticalError) {
      return <Modal animationType='fade' >
        <CriticalError {...this.state.criticalError} />
      </Modal>
    }
    return <Root>
      {this.renderContent()}
    </Root>
  }
}
