const Clock = ({time} : any) => {
    return <div className="clock" >
        <span>🕒</span>
        {time.toLocaleTimeString()}
    </div>
} 

export default Clock;