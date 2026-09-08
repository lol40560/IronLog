import Foundation
import SwiftData

struct LoggedSet: Codable, Identifiable {
    var id = UUID()
    var weight: Double = 0
    var reps: Int = 8
    var done = false
    var warmup = false
}
struct LoggedExercise: Codable, Identifiable {
    var id = UUID()
    var name: String
    var muscle: String
    var equipment: String
    var sets = [LoggedSet(), LoggedSet(), LoggedSet()]
}
@Model final class TrainingSession {
    var id: UUID = UUID()
    var started: Date = Date()
    var ended: Date?
    var title: String = "自由訓練"
    var gym: String = "我的健身房"
    var exerciseData: Data = Data()
    init(title: String, gym: String, exercises: [LoggedExercise]) {
        self.title = title; self.gym = gym
        exerciseData = (try? JSONEncoder().encode(exercises)) ?? Data()
    }
    var exercises: [LoggedExercise] {
        get { (try? JSONDecoder().decode([LoggedExercise].self, from: exerciseData)) ?? [] }
        set { if let data = try? JSONEncoder().encode(newValue) { exerciseData = data } }
    }
    var completedSets: Int { exercises.flatMap(\.sets).filter(\.done).count }
    var volume: Double { exercises.flatMap(\.sets).filter { $0.done && !$0.warmup }.reduce(0) { $0 + $1.weight * Double($1.reps) } }
}
@Model final class TrainingRoutine {
    var id: UUID = UUID()
    var title: String = "我的課表"
    var exerciseData: Data = Data()
    init(title: String, exercises: [LoggedExercise]) {
        self.title = title; exerciseData = (try? JSONEncoder().encode(exercises)) ?? Data()
    }
    var exercises: [LoggedExercise] {
        get { (try? JSONDecoder().decode([LoggedExercise].self, from: exerciseData)) ?? [] }
        set { if let data = try? JSONEncoder().encode(newValue) { exerciseData = data } }
    }
}
@Model final class EquipmentMemory {
    var gym: String = ""
    var exercise: String = ""
    var cue: String = ""
    init(gym: String, exercise: String, cue: String) { self.gym = gym; self.exercise = exercise; self.cue = cue }
}
struct LibraryExercise: Identifiable {
    var id: String { name }
    let name: String; let muscle: String; let equipment: String
    var logged: LoggedExercise { LoggedExercise(name: name, muscle: muscle, equipment: equipment) }
}
let exerciseLibrary: [LibraryExercise] = [
    .init(name: "槓鈴臥推", muscle: "胸部", equipment: "槓鈴"),
    .init(name: "上斜啞鈴推舉", muscle: "胸部", equipment: "啞鈴"),
    .init(name: "滑輪夾胸", muscle: "胸部", equipment: "滑輪"),
    .init(name: "伏地挺身", muscle: "胸部", equipment: "徒手"),
    .init(name: "槓鈴划船", muscle: "背部", equipment: "槓鈴"),
    .init(name: "滑輪下拉", muscle: "背部", equipment: "滑輪"),
    .init(name: "坐姿划船", muscle: "背部", equipment: "滑輪"),
    .init(name: "引體向上", muscle: "背部", equipment: "徒手"),
    .init(name: "槓鈴深蹲", muscle: "腿部", equipment: "槓鈴"),
    .init(name: "羅馬尼亞硬舉", muscle: "腿後側", equipment: "槓鈴"),
    .init(name: "腿推", muscle: "腿部", equipment: "機械"),
    .init(name: "腿屈伸", muscle: "股四頭肌", equipment: "機械"),
    .init(name: "腿後勾", muscle: "腿後側", equipment: "機械"),
    .init(name: "臀推", muscle: "臀部", equipment: "槓鈴"),
    .init(name: "啞鈴肩推", muscle: "前三角", equipment: "啞鈴"),
    .init(name: "滑輪側平舉", muscle: "側三角", equipment: "滑輪"),
    .init(name: "反向飛鳥", muscle: "後三角", equipment: "啞鈴"),
    .init(name: "面拉", muscle: "後三角", equipment: "滑輪"),
    .init(name: "貝氏彎舉", muscle: "二頭肌", equipment: "滑輪"),
    .init(name: "啞鈴彎舉", muscle: "二頭肌", equipment: "啞鈴"),
    .init(name: "繩索下壓", muscle: "三頭肌", equipment: "滑輪"),
    .init(name: "滑輪捲腹", muscle: "核心", equipment: "滑輪"),
    .init(name: "站姿提踵", muscle: "小腿", equipment: "機械")
]
enum IronUnits {
    static func display(_ kg: Double, pounds: Bool) -> Double { pounds ? kg * 2.2046226218 : kg }
    static func kilograms(_ value: Double, pounds: Bool) -> Double { pounds ? value / 2.2046226218 : value }
    static func csv(_ sessions: [TrainingSession]) -> String {
        func quote(_ value: String) -> String {
            let safe = ["=", "+", "-", "@"].contains(String(value.prefix(1))) ? "'" + value : value
            return "\"" + safe.replacingOccurrences(of: "\"", with: "\"\"") + "\""
        }
        var rows = ["date,workout,gym,exercise,set,weight_kg,reps,warmup,completed"]
        for session in sessions where session.ended != nil {
            for ex in session.exercises { for (index, set) in ex.sets.enumerated() {
                rows.append([quote(session.started.ISO8601Format()), quote(session.title), quote(session.gym), quote(ex.name), String(index + 1), String(set.weight), String(set.reps), String(set.warmup), String(set.done)].joined(separator: ","))
            } }
        }
        return rows.joined(separator: "\r\n")
    }
}
