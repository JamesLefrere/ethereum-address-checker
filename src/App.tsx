import React, { FC, useEffect, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import { Reset } from 'styled-reset'
import { keccak256 } from 'js-sha3'
import { Change, diffChars } from 'diff'

enum Check {
  NothingToCheck = 'Nothing to check',
  NotValidAddress1 = 'Top address not valid',
  NotValidAddress2 = 'Bottom address not valid',
  Equal = 'Equal',
  NotEqual = 'Not equal',
}
const Result = styled.div<{ check: Check }>`
  font-size: 2rem;
  padding: 2rem;
  color: ${({ check }) => (check === Check.Equal ? 'greenyellow' : check === Check.NotEqual ? 'orangered' : 'grey')};
`

const DiffChar = styled.div<{ removed?: boolean; added?: boolean }>`
  ${({ added, removed }) => `
    color: ${added ? 'greenyellow' : removed ? 'orangered' : 'grey'};
  `}
`

const DiffResultContainer = styled.div`
  display: flex;
  justify-content: center;
`

const EtherscanLinkContainer = styled.a`
  color: blueviolet;
  text-decoration: none;
`

const Protip = styled.div`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 1rem;
  font-size: 1rem;
  > :first-child {
    font-weight: bold;
  }
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;

  header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 4rem;
    h1 {
      font-size: 2rem;
      font-weight: bold;
    }
    p {
      font-style: italic;
    }
  }
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 4rem;
    input {
      appearance: none;
      background: transparent;
      border: 2px #555 solid;
      padding: 1rem;
      font-family: monospace;
      font-size: 2rem;
      border-radius: 1rem;
      width: 100%;
      color: white;
      text-align: center;
      &:focus {
        outline: none;
        border-color: blueviolet;
      }
    }
  }
  footer {
    font-size: 1rem;
    padding: 1rem;
    a {
      color: blueviolet;
      text-decoration: none;
    }
  }
`

const Page = styled.div`
  height: 100vh;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  text-align: center;
  font-size: 1.5rem;
  color: #aaa;
`

const checkAddressChecksum = (address: string): boolean => {
  // Check each case
  address = address.replace(/^0x/i, '')
  const addressHash = keccak256(address.toLowerCase()).replace(/^0x/i, '')

  for (let i = 0; i < 40; i++) {
    // the nth letter should be uppercase if the nth digit of casemap is 1
    if (
      (parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
      (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])
    ) {
      return false
    }
  }
  return true
}

const isAddress = (address: string): boolean => {
  // check if it has the basic requirements of an address
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false
    // If it's ALL lowercase or ALL upppercase
  } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
    return true
    // Otherwise check each case
  } else {
    return checkAddressChecksum(address)
  }
}

const EtherscanLink: FC<{ address: string }> = ({ address }) => (
  <EtherscanLinkContainer href={`https://etherscan.io/address/${address}`} target="_blank" rel="nofollow noopener">
    View on Etherscan
  </EtherscanLinkContainer>
)

const DiffResult: FC<{ diff: Change[] }> = ({ diff }) => {
  return (
    <DiffResultContainer>
      {diff.map(({ value, added, removed }, index) => (
        <DiffChar removed={removed} added={added} key={`${value}${index}`}>
          {value}
        </DiffChar>
      ))}
    </DiffResultContainer>
  )
}

const Checker: FC = () => {
  const [check, setCheck] = useState<Check>(Check.NothingToCheck)
  const [address1, setAddress1] = useState<string>('')
  const [address2, setAddress2] = useState<string>('')
  const [diff, setDiff] = useState<Change[]>()

  useEffect(() => {
    const listener = (event: ClipboardEvent) => {
      const paste: string | undefined = (event.clipboardData || (window as any).clipboardData).getData('text').toString()
      if (paste) {
        if (!address1 || !isAddress(address1)) {
          setAddress1(paste)
        } else if (!address2 || !isAddress(address2)) {
          setAddress2(paste)
        }
      }
    }
    document.addEventListener('paste', listener)
    return () => {
      document.removeEventListener('paste', listener)
    }
  }, [address1, address2])

  useEffect(() => {
    if (address1 && !isAddress(address1)) {
      setCheck(Check.NotValidAddress1)
      return
    }
    if (address2 && !isAddress(address2)) {
      setCheck(Check.NotValidAddress2)
      return
    }

    if (address1 && address2) {
      if (address1.toLowerCase() === address2.toLowerCase()) {
        setCheck(Check.Equal)
      } else {
        setCheck(Check.NotEqual)
        setDiff(diffChars(address1, address2))
      }

      return
    }

    setCheck(Check.NothingToCheck)
  }, [address1, address2])

  return (
    <Page>
      <Container>
        <div>
          <header>
            <h1>Ethereum Address Checker</h1>
            <p>Compare two addresses as a sanity check</p>
            <p>Healthy paranoia since 2021</p>
          </header>
          <main>
            <Protip>
              <span>Protip: </span>
              Just paste anywhere to input the addresses
            </Protip>
            <div>
              <input
                name="ethAddress1"
                type="text"
                placeholder="Check this"
                value={address1}
                onChange={(event) => {
                  setAddress1(event.target.value)
                }}
              />
            </div>
            <div>
              <input
                name="ethAddress2"
                type="text"
                placeholder="Against this"
                value={address2}
                onChange={(event) => {
                  setAddress2(event.target.value)
                }}
              />
            </div>
            <Result check={check}>{check}</Result>
            {check === Check.NotEqual && diff && <DiffResult diff={diff} />}
            {check === Check.Equal && address1 && <EtherscanLink address={address1} />}
          </main>
        </div>
        <footer>
          <p>
            <a href="https://mstable.org" target="_blank" rel="noopener nofollow">
              mStable
            </a>{' '}
            cares about security
          </p>
        </footer>
      </Container>
    </Page>
  )
}

const GlobalStyle = createGlobalStyle`
  body {
    background: black;
  }
`

export const App: FC = () => {
  return (
    <>
      <GlobalStyle />
      <Reset />
      <Checker />
    </>
  )
}
