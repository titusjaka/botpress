import { Button, Classes, Colors, Dialog, Icon, Intent } from '@blueprintjs/core'
import axios from 'axios'
import React, { Fragment, useEffect, useState } from 'react'
import { toastFailure } from '~/components/Shared/Utils'
import EventBus from '~/util/EventBus'

import ActionItem from './ActionItem'
import style from './StatusBar.styl'

const adminUrl = `${window['ROOT_PATH']}${window['API_PATH']}/admin/server`

const ConfigStatus = () => {
  const [isDifferent, setDifferent] = useState(false)
  const [isRestarting, setRestart] = useState(false)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    fetchHash()

    const configUpdated = event => setDifferent(event.initialHash !== event.newHash)

    EventBus.default.on('config.updated', configUpdated)
    return () => EventBus.default.off('config.updated', configUpdated)
  }, [])

  useEffect(() => {
    if (!isRestarting) {
      return
    }

    const interval = setInterval(async () => {
      try {
        await axios.get('/status', { timeout: 500 })
        window.location.reload()
      } catch (err) {} // silent intended
    }, 1000)
    return () => clearInterval(interval)
  }, [isRestarting])

  const fetchHash = async () => {
    try {
      const { data } = await axios.get(`${adminUrl}/configHash`)
      if (data.initialHash && data.currentHash && data.initialHash !== data.currentHash) {
        setDifferent(true)
      }
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const restartServer = async () => {
    try {
      await axios.post(`${adminUrl}/rebootServer`)
      setRestart(true)
    } catch (err) {
      toastFailure(err.message)
    }
  }

  return (
    <Fragment>
      <ActionItem
        id="statusbar_configstatus"
        title="Config Status"
        description="Pending changes"
        className={style.right}
        onClick={() => setOpen(true)}
      >
        {isDifferent && <Icon icon="cog" style={{ color: Colors.RED5 }} />}
      </ActionItem>

      <Dialog isOpen={isOpen} onClose={() => setOpen(false)} transitionDuration={0} title={'Configuration Outdated'}>
        <div className={Classes.DIALOG_BODY}>
          {!isRestarting ? (
            <div>
              Changes were made to the main Botpress configuration file. <br />
              It is recommended to restart the server so they can take effect.
            </div>
          ) : (
            <div>Server restart in progress, please wait...</div>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-restart"
              text={isRestarting ? 'Please wait...' : 'Restart server now'}
              disabled={isRestarting}
              onClick={restartServer}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </Dialog>
    </Fragment>
  )
}

export default ConfigStatus
