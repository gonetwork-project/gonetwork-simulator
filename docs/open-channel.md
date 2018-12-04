# Opening a Netting Channel

![main](screens/start-acc.png)

Starting in the main view, select an account. You should see account details view.

![details](screens/details.png)

Tapping `Open Channel` button will let you allow to specify amount and select peer. Remember that you can have up to one active channel per peer.
![open](screens/open-params.png)

Opening requires four blockchain operation. They need to be performed in a sequence. Status of each step is reflected in UI. During opening the UI is block.
![open-wait](screens/open-wait.png)

Upon success you will be redirected to channel's details. And the newly opened channel will be visible on the list of all netting channels.
![open-after](screens/open-after.png)

The changes to to netting channel lifecycle are reflected in the UI alongside set of possible actions.

In case no more peers without netting channel, the `Open Channel` button is inactive / grayed out.
