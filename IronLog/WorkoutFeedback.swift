import AVFoundation
import UIKit

@MainActor final class WorkoutFeedback {
    static let shared = WorkoutFeedback()
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private init() {
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: format)
    }
    enum Event { case setCompleted, workoutCompleted, restEnded }
    func play(_ event: Event) {
        let haptic: UINotificationFeedbackGenerator.FeedbackType = event == .restEnded ? .warning : .success
        let generator = UINotificationFeedbackGenerator(); generator.prepare(); generator.notificationOccurred(haptic)
        guard UserDefaults.standard.object(forKey: "trainingSounds") as? Bool ?? true else { return }
        let notes: [(Double, Double)] = switch event {
        case .setCompleted: [(180, 0.09)]
        case .workoutCompleted: [(150, 0.10), (225, 0.16)]
        case .restEnded: [(440, 0.12)]
        }
        do { if !engine.isRunning { try engine.start() } } catch { return }
        let buffer = makeBuffer(notes)
        player.scheduleBuffer(buffer, at: nil); if !player.isPlaying { player.play() }
    }
    private func makeBuffer(_ notes: [(Double, Double)]) -> AVAudioPCMBuffer {
        let frames = AVAudioFrameCount(notes.reduce(0) { $0 + Int($1.1 * format.sampleRate) })
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames)!; buffer.frameLength = frames
        guard let data = buffer.floatChannelData?[0] else { return buffer }
        var cursor = 0
        for (frequency, duration) in notes {
            let count = Int(duration * format.sampleRate)
            for sample in 0..<count {
                let envelope = Float(1 - Double(sample) / Double(count))
                data[cursor + sample] = sinf(Float(2 * .pi * frequency * Double(sample) / format.sampleRate)) * envelope * 0.16
            }
            cursor += count
        }
        return buffer
    }
}
