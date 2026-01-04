import React, {useEffect, useState} from 'react';

const useAlert = () => {
    const [showAlert, setShowAlert] = useState(false);

    const ALERT_DURATION_MS = 2000;

    useEffect(() => {
        if (showAlert) {
            setTimeout(() => {
                setShowAlert(false);
            }, ALERT_DURATION_MS);
        }
    },[showAlert])

    return {showAlert,setShowAlert};
};

export default useAlert;