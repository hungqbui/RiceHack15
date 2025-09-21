const OwlIcon = () => (
        <svg
            className="owl-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width="100"
            height="100"
        >
            <g className="owl-body">
                <path d="M50,90 C25,90 10,70 10,50 C10,30 25,10 50,10 C75,10 90,30 90,50 C90,70 75,90 50,90 Z" />
                <path d="M50,15 C35,15 25,25 25,40 C25,55 35,65 50,65 C65,65 75,55 75,40 C75,25 65,15 50,15 Z" fill="var(--background-color)" />
            </g>
            <g className="owl-eyes">
                <circle cx="38" cy="45" r="12" fill="var(--background-color)" stroke="var(--text-color)" strokeWidth="2" />
                <circle cx="62" cy="45" r="12" fill="var(--background-color)" stroke="var(--text-color)" strokeWidth="2" />
                <circle cx="38" cy="45" r="4" fill="var(--text-color)" />
                <circle cx="62" cy="45" r="4" fill="var(--text-color)" />
            </g>
             <path className="owl-beak" d="M50,55 L55,60 L45,60 Z" />
            <path className="owl-tuft-left" d="M30,15 Q35,5 40,15" stroke="var(--text-color)" strokeWidth="2" fill="none" />
            <path className="owl-tuft-right" d="M70,15 Q65,5 60,15" stroke="var(--text-color)" strokeWidth="2" fill="none" />
        </svg>
    );

export default OwlIcon;