const Clock = ({time} : any) => {
    return <div className="clock" style={{ marginRight: '10px' }}>
        <span>🕒</span>
        {time.toLocaleTimeString()}
    </div>
} 

export default Clock;