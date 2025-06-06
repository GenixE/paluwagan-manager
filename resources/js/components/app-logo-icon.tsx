import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 21 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 Z M20 10 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0 Z M10 30 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0 Z M30 30 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0 Z"
            />
        </svg>
    );
}
