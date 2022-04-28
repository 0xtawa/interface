import disperseContract from 'abis/disperseContract';
import { DisclosureState } from 'ariakit';
import BigNumber from 'bignumber.js';
import React from 'react';
import toast from 'react-hot-toast';
import { BeatLoader } from 'react-spinners';
import { networkDetails } from 'utils/constants';
import { useContractWrite, useNetwork } from 'wagmi';

interface DisperseSendProps {
  dialog: DisclosureState;
  data: { [key: string]: number };
  setTransactionHash: React.Dispatch<React.SetStateAction<string>>;
  transactionDialog: DisclosureState;
}

export default function DisperseSend({ dialog, data, setTransactionHash, transactionDialog }: DisperseSendProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [{ data: network }] = useNetwork();
  const [{}, disperseEther] = useContractWrite(
    {
      addressOrName: networkDetails[Number(network.chain?.id)].disperseAddress,
      contractInterface: disperseContract,
    },
    'disperseEther'
  );
  function sendGas() {
    let ether = new BigNumber(0);
    const recipients: string[] = [];
    const values: string[] = [];
    Object.keys(data).map((p) => {
      recipients.push(p);
      const value = new BigNumber(data[p]).times(1e18).toFixed(0);
      values.push(value.toString());
      ether = ether.plus(value);
    });
    setIsLoading(true);
    disperseEther({
      args: [recipients, values],
      overrides: {
        value: ether.toString(),
      },
    }).then((data) => {
      setIsLoading(false);
      let loading: any;
      if (data.error) {
        dialog.hide();
        loading = toast.error(data.error.message);
      } else {
        loading = toast.loading('Dispersing Gas');
        setTransactionHash(data.data?.hash ?? '');
        dialog.hide();
        transactionDialog.show();
      }
      data.data?.wait().then((receipt) => {
        toast.dismiss(loading);
        receipt.status === 1 ? toast.success('Successfully Dispersed Gas') : toast.error('Failed to Disperse Gas');
      });
    });
  }

  return (
    <>
      <button onClick={sendGas} type="button" className="form-submit-button !mt-8">
        {isLoading ? <BeatLoader size={6} color="white" /> : 'Send'}
      </button>
    </>
  );
}
